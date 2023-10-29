# Quack Hunt Gun Schema

## Variants

### Powered by battery

<!---
```plantuml
@startuml Powered by battery

component controller <<ESP8266/ESP32>>
component button <<Trigger>>
component sensor <<RGB Sensor>>
component display <<LCD Display 16x2>>
component battery <<Li-Ion 18650 3.7V Battery>>
component switch <<Power Switch>>
component bms <<Battery Management System>>
component usb <<microUSB>>

controller <-down- button: GPIO
controller <-down-> sensor: I2C
controller <-down-> display: I2C

controller <-right- switch: Power
switch <-right- bms: Power
bms <-right-> battery: Power
bms <-down- usb: Power

@enduml
```
-->

![Powered by battery](https://www.plantuml.com/plantuml/dsvg/RP7RQeD048RlVOfv0TiceJP8a61IWj1IgMtlFGn6s4FO7R6-VQUwjbd8bSv-dyxCltjBfQ5U2iZrW0ORg4QeIY8qOn3KMbwqGaLGQqL62u46Thld8j-ke-YUdvjrabnfLK-a5IiVfcjRD1wqgAms3DzFAHHJuV6cinTHZYoy78vmTDKg-lPwkEachGipxhRQHeyFiBbx-e9qPdxReQFwpFgq8HHJwVzHMiRkMtWjLTcY_0N5Q0cbv_QsObTsjT6VHSeek8ucRFIWGXT33ASyUxl14nT53DdwS9ExA6R1DpZOCuLkgtY-jc2k_Yblj21-_JjFbl0yw8RcpPRZO8-gwQNu0G00)

### Powered by USB

<!-- 
```plantuml
@startuml Powered by USB

component controller <<ESP8266/ESP32>>
component button <<Trigger>>
component sensor <<RGB Sensor>>
component display <<LCD Display 16x2>>
component usb <<microUSB>>

controller <-down- button: GPIO
controller <-down-> sensor: I2C
controller <-down-> display: I2C

controller <-right- usb: Power

@enduml
```
-->

![Powered by USB](https://www.plantuml.com/plantuml/dsvg/RP11QeKm443tESLSG4ejI14HKOi8XKfj3w0c-8MOaIJYz_P_n2mCk0h3Uo4landRQRlE4XhSX1OS-Xt-svon0US5bL0M1bHMevH2Gv9yjSrd64LlT7w4QNhH-jLQLAJywMaSXVQW4ShWSV-tog4z1f_poIoosqduBaeetVGUFVqtLjEJCa-3HeeanAvn0STD1IuaXggfVsvuwc9YgCFYbhkOK_0D-jh31aT7V6wCiKmeJWjy0G00)
