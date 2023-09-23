# Levantar los servicios con

`docker-compose up --build`

# Levantar los servicios con replicas

`docker-compose up --build --scale nombre_servicio=cant_instancias`


# Para correr los scenarios de artillery

`npm run scenario root api`

o mas generico

`./run-scenario.sh "nombre del endpoint" api`

# Puntos a tener en cuenta

* Antes de hacer las pruebas con artillery, habria que hacer un "warm up" de los endpoints ya que sino
graphite puede no tomar los datos
* Cuando se corra con artillery muchos request a una api, aunque haya terminado de ejecutarse la prueba pueden quedar en espera las respuestas que dará el servidor, por lo que si se hacen nuevas pruebas sin que el servidor termine de responder todos sus pedidos puede perjudicar a los resultados/visualizaciones de las nuevas pruebas. Por eso mismo si vemos (por grafana por ej) que el servidor sigue contestando, quizas conviene tirarlo abajo antes de hacer nuevas pruebas
* Para graphite prestar atención a las unidades de los graficos antes de hacer un analisis
* Para graphite se le pueden aplicar funciones a los graficos para que nos muestren algo más útil, por ejemplo si nos muestran el uso del CPU acumulado quizas no sirve mucho
* Para la parte de phases (los pedidos que hara artillery) hay que ver que tenga sentido con la toma de datos del graphite conf
* Artillery no siempre es exacto, quizas le pediste generar 50 pedidos y te genero 45, chequear con graficos y reporte de artillery
* Ponerle al script de artillery un cooldown (buscar en la doc) en la parte de phases para que en los graficos de grafana haya como una parte que vale 0 y saber bien cuando termino la prueba(es para que quede mejor el grafico)
* Se debe medir un caso base con artillery y ver como reaccionan los endpoints, luego se usara redis, replicacion y request limit para ver como mejoran los tiempos de espera