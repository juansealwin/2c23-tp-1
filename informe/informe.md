
## Introducción

En este Trabajo Práctico, se compararon diferentes tácticas y tecnologías para analizar cómo es el impacto en los atributos de calidad de un servicio HTTP implementado en Node con Express. Para ello, se implementó una API que, mediante el consumo de otras APIs externas, brindará distintos datos a los usuarios. Junto con `Artillery`, se sometió a los endpoints a diversas intensidades de carga y distintas configuraciones, para medir y analizar los resultados obtenidos.

El webserver que provee los distintos endpoints se encuentra dockerizado con junto con los servicios que nos ayudaron a tomar las mediciones sobre la API (`Graphite`, `Grafana` y `Cadvisor`), un servicio de base de datos para utilizar como caché (`Redis`) y también `Nginx` como servicio de reverse proxy y balanceador de carga.

Los endpoints que se desarrollaron para el webserver son los siguientes:

- `Ping`: para healthcheck
- `METAR`: para obtener información meteorológica de un aeródromo
- `Spaceflight News`: para obtener las últimas noticias sobre actividad espacial
- `Random Quote`: para obtener una cita famosa aleatoria.

A la hora de comparar las distintas tácticas se evaluaron distintos escenarios:
- Un caso base donde simplemente se realizan solicitudes a los distintos endpoints
- Uso de caching con mediante Redis
- Escalando el servicio a 3 réplicas
- Rate limiting para limitar el consumo de los distintos endpoint

Para evaluar estos escenarios se generaron distintos escenarios de carga para un posterior análisis de cómo afecta a los atributos de calidad de la aplicación.

## Escenarios

### Base:

El escenario base simula un caso de uso normal del servidor con baja tasa de solicitudes.

```yaml
phases:
- name: Warm up
  duration: 60
  arrivalRate: 2
- name: Ramp up
  duration: 30
  arrivalRate: 2
  rampTo: 10
- name: Plain
  duration: 60
  arrivalRate: 10
- name: Ramp down
  duration: 30
  arrivalRate: 10
  rampTo: 2
- name: Cool down
  duration: 60
  arrivalRate: 2
```

### Stress:

El escenario stress simula un uso más exaustivo del servidor con un mayor número de solicitudes.

```yaml
phases:
- name: Warm up
  duration: 60
  arrivalRate: 2
- name: Ramp up
  duration: 30
  arrivalRate: 2
  rampTo: 100
- name: Plain
  duration: 60
  arrivalRate: 100
- name: Ramp down
  duration: 30
  arrivalRate: 100
  rampTo: 2
- name: Cool down
  duration: 60
  arrivalRate: 2
```


# Tácticas

## Caso sin tácticas

![Caso Sin Tácticas](tactica-sintactica.jpg)

Este caso consta de una configuración inicial sin tácticas implementadas, donde simplemente se utiliza a Nginx como proxy reverso y un servidor (nodo) que se conecta con las APIs externas a cada solicitud recibida.


### Escenario base:

![base_caso_base_1.png](base_caso_base_1.png)
En el primer gráfico podemos observar la cantidad de solicitudes al servidor desglosadas por endpoint. Y en el segundo gráfico los resultados de dichas solicitudes, destacando que todas fueron ejecutadas correctamente.

![base_caso_base_2.png](base_caso_base_2.png)
Estos gráficos representan el tiempo total de respuesta que le lleva a cada uno de los endpoints de la API, medido desde el lado del servidor.

![base_caso_base_3.png](base_caso_base_3.png)
Aquí se representa el tiempo de respuesta para obtener la información de cada API externa. Podemos observar que `/space_flight` y `/quote` son los cuales presentan mayor latencia, llegando a superar la unidad de segundos.

![base_caso_base_4.png](base_caso_base_4.png)

En el primer gráfico, vemos el tiempo de respuesta combinado desde el lado del cliente, que es similar al anterior mencionado pero se le agrega la latencia que se tiene hasta llegar finalmente al cliente.

### Escenario stress:

Al iniciarlo, empezamos a obtener fallas provenientes de la API de Quote.
Del reporte de Node, pudimos obtener que se trata de errores 429 (too many requests) y que el servidor de destino especifica que el rate-limit es de 220 por minuto y un retry-after de 60 segundos.

![stress_sin_tacticas_1.png](stress_sin_tacticas_1.png)
![stress_sin_tacticas_2.png](stress_sin_tacticas_2.png)
![stress_sin_tacticas_3.png](stress_sin_tacticas_3.png)

Podemos observar que los endpoints con conexiones a APIs externas tienen una peor performance ante el estrés que el caso de `/ping`. También, `/metar` muestra ser el de mejor rendimiento en todas las pruebas con saltos en latencia más leves que los otros.

![stress_sin_tacticas_4.png](stress_sin_tacticas_4.png)

Aquí se puede observar que el `/quote` presenta un comportamiento lineal en periodos de 60 segundos y eso es debido a la limitación de solicitudes impuesta por el servidor externo. Durante ese periodo, todas las solicitudes fueron rechazadas.

![stress_sin_tacticas_5.png](stress_sin_tacticas_5.png)

Al tener un sólo nodo atendiendo todas las solicitudes, el CPU muestra un pico máximo de 47.6%, mientras que la memoria no sufrió cambios significativos en toda la prueba.


## Técnica Caché

![Caso Caché](tactica-cache.jpg)

Este caso tiene una implementacción de base de datos Redis para la caché. La información será almacenada por un periodo de 3 segundos para así disminuir la cantidad de solicitudes a las APIs externas.


## Escenario base

![base_con_cache_1.png](base_con_cache_1.png)
![base_con_cache_2.png](base_con_cache_2.png)

En el gráfico "Max endpoint response time", lo que se puede observar es que los picos donde la caché no fue utilizada. Como estos picos son los máximos dentro de la ventana de diez segundos, el grafico parece constante.

Por otro lado el segundo gráfico "Mean endpoint response time", se observa que el tiempo promedio de latencia de los endpoint baja significativamente.

Por ejemplo, si tomamos el caso de "Spaceflight", podemos ver que cuando realiza las solicitudes al servidor tarda 852ms en promedio, pero cuando utiliza la caché el promedio baja a 247ms.

![base_con_cache_3.png](base_con_cache_3.png)
![base_con_cache_4.png](base_con_cache_4.png)


## Escenario stress

![feli_stress_con_cache.png](feli_stress_con_cache.png)

Aquí se puede observar un aumento de las solicitudes con errores. Esto se puede explicar por el endpoint "/quote", el cual no posee implementación de caché pero lo seguimos evaluando para su comparativa con el resto de los endpoint en términos de rendimiento general. También consideramos que dicha API externa no es tan robusta como las demás para este tipo de usos. 

![feli_stress_con_cache_2.png](feli_stress_con_cache_2.png)

Podemos observar que "Max endpoint response time" nos arroja unos resultados más constantes en el caso de "Spaceflight" y "Metar" comparando con el escenario Stress sin caché. Ya no aparecen picos de latencia alta.

![feli_stress_con_cache_3.png](feli_stress_con_cache_3.png)
![feli_stress_con_cache_4.png](feli_stress_con_cache_4.png)
No se observan cambios significativos en el uso de la memoria.

# Replicación

![Caso Replicación](tactica-loadbalancer.jpg)

En este caso, cambiamos la configuración de Nginx de Proxy reverso por el de Balanceador de carga. De esta forma, y agregando dos nodos más, Nginx se encargará de la distribución de las solicitudes de cada endpoint entre los tres nodos.

## Caso base

![replicas_caso_base_1.png](replicas_caso_base_1.png)
No se observaron errores en las solicitudes.

![replicas_caso_base_2.png](replicas_caso_base_2.png)
![replicas_caso_base_3.png](replicas_caso_base_3.png)
![replicas_caso_base_4.png](replicas_caso_base_4.png)
En este gráfico podemos observar que la distribución de carga del CPU y la memoria es equitativa entre los nodos. 

Si comparamos este escenario con el caso base de un solo nodo, podemos ver que la carga por nodo disminuyo. Es decir, se distribuyó el procesamiento de los pedidos en los tres nodos.


## Stress

![replicas_stress_1.png](replicas_stress_1.png)
![replicas_stress_2.png](replicas_stress_2.png)
![replicas_stress_3.png](replicas_stress_3.png)
![replicas_stress_4.png](replicas_stress_4.png)

# Rate limiting

![Caso Rate limit](tactica-sintactica.jpg)

Este caso, se agrega una limitación de 10 solicitudes por segundo.


## Caso base

![ratelimit_base_1.png](ratelimit_caso_base_1.png)
![ratelimit_base_2.png](ratelimit_caso_base_2.png)
![ratelimit_base_3.png](ratelimit_caso_base_3.png)
![ratelimit_base_4.png](ratelimit_caso_base_4.png)

No hay se observaron diferencias significativas respecto del caso base sin rate limiting.


## Stress

![ratelimit_stress_1.png](ratelimit_stress_1.png)
![ratelimit_stress_2.png](ratelimit_stress_2.png)
![ratelimit_stress_3.png](ratelimit_stress_3.png)
![ratelimit_stress_4.png](ratelimit_stress_4.png)

# Replicación + Caché 

![Caso Loadbalancer-cache](tactica-loadbalancer-cache.jpg)

Este caso, se combinan ambas técnicas de Replicación y caché.

## Caso base

![replicasyredis_base_1.png](replicasyredis_caso_base_1.png)
![replicasyredis_base_2.png](replicasyredis_caso_base_2.png)
![replicasyredis_base_3.png](replicasyredis_caso_base_3.png)
![replicasyredis_base_4.png](replicasyredis_caso_base_4.png)

En este caso tuvimos mediciones similares a las de uso de caché con Redis. También podemos ver como se distribuyo la carga con los distintos nodos respecto del caso base (al igual como sucedió con el caso de replicas)


## Stress


![replicasyredis_stress_1.png](replicasyredis_stress_1.png)
![replicasyredis_stress_2.png](replicasyredis_stress_2.png)
![replicasyredis_stress_4.png](replicasyredis_stress_4.png)

Al igual que en el caso anterior las cargas fueron distribuidas en los distintos nodos. Por otro lado, pese al haber obtenido errores estos fueron mucho menos si los comparamos con el caso base con stress. 
Por último, vemos que los tiempos de respuesta de los endpoints fueron muy bajos debido al uso de caché.