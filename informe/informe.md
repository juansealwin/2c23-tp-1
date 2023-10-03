# Sin tácticas 

## Caso base

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

![img_9.png](img_9.png)
![img_10.png](img_10.png)
![img_11.png](img_11.png)
![img_12.png](img_12.png)
![img_13.png](img_13.png)
![img_14.png](img_14.png)
![img_15.png](img_15.png)
![img_16.png](img_16.png)

## Stress

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

![img_1.png](img_1.png)
![img_2.png](img_2.png)
![img_3.png](img_3.png)
![img_4.png](img_4.png)
![img_5.png](img_5.png)
![img_6.png](img_6.png)
![img_7.png](img_7.png)
![img_8.png](img_8.png)