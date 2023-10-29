# Quack Hunt Schema

## Variants

### Powered by battery

<!---
```plantuml
@startuml Powered by battery

component external_power <<Power Supply>>

component Gun  {
    component controller <<ESP8266/ESP32>>
    component button <<Trigger>>
    component sensor <<RGB Sensor>>
    component display <<LCD Display 16x2>>
    component battery <<Li-Ion 18650 3.7V Battery>>
    component switch <<Power Switch>>
    component bms <<Battery Management System>>
    portin charge <<Charging Port>>
    port wifi <<WiFi>>
    portin optical <<Optical Port>>
}

external_power -right-> charge: Power
charge -down-> bms: Power

controller <-up-> wifi: WiFi

optical -up-> sensor: Color

controller <-down- button: GPIO
controller <-down-> sensor: I2C
controller <-down-> display: I2C

controller <-down- switch: Power
switch <-down- bms: Power
bms <-down-> battery: Power

component router <<Router>>

router <-down-> wifi: WiFi

component App {
    component websocket <<WebSocket>>
    component frontend <<Frontend>>
    component backend <<Backend>>
    portout screen <<Screen>>
    port network <<Network>>
}

websocket <-up-> network: WebSocket

router <-down-> network: WiFi

websocket <-down-> backend
backend <-left-> frontend

frontend -right-> screen: Screen

screen -down-> optical: Color recognition

@enduml
```
-->

![Powered by battery](https://www.plantuml.com/plantuml/dsvg/RLD_RzCm4FtVd-A-G85jeapHL8rshAe4h288_aHfUasjERRbECeYn7Vd75zQRsd_oRFVkn_dUxrlVE5yMolOcWuTxc7Nmwxm7bqlH6bgQpHg3_X2DxfGVsoGmTtT88UyjLRrYqKgNRSQuAy0-fqk2MdlZ593x9TyUtizdx-dxyqr1R-MxbhlZIRPJoUh2jr4qA1kJCZpOxs4F1occhrih2fw4drTFS03dwxcBzDwF6sGojc6Ab_TpZz-W9jtdtx1CdBJ5Zhfo-Fv6ORZD7FTa8HpmBT25nNMWSZxncFDUckSbnhAO-4g9Fqg0Aahs1AHQA2J1qdyR_aeNuSQwsLPAEAU677eFo7UB6v6RthqimMNo-BQ1HUVxKsdYQJ6HqQacvkrbjZGHmQX3I76qf69cybWPPHv4nfJyt8pM6ytJrC-IR6vNbtaUR5HS471gndRZwUHJ0SZUCxA7c0kTRCpBJ71R0C8LkSh3axV8mtyREtaNz3XhZ7bC_gmHjpb0vxOvk1eAjHx4Zqol61Q2XqaouWIHvYM35ewH4rqFe241Os-C-wPkEyHHQESU-Criow3KwVJqLd3qwSvM34sAlXBXCA39sASKeWHdSp9tMSGcnU2f-6Sez_PP-2mD9MMNXgItbEYjbR_0G00)

### Powered by USB

<!-- 
```plantuml
@startuml Powered by USB

component external_power <<Power Supply>>

component Gun  {
    component controller <<ESP8266/ESP32>>
    component button <<Trigger>>
    component sensor <<RGB Sensor>>
    component display <<LCD Display 16x2>>
    portin power <<Power Port>>
    port wifi <<WiFi>>
    portin optical <<Optical Port>>
}

external_power -left-> power: Power

controller <-up-> wifi: WiFi

optical -up-> sensor: Color

controller <-down- button: GPIO
controller <-down-> sensor: I2C
controller <-down-> display: I2C

controller <-down- power: Power

component router <<Router>>

router <-down-> wifi: WiFi

component App {
    component websocket <<WebSocket>>
    component frontend <<Frontend>>
    component backend <<Backend>>
    portout screen <<Screen>>
    port network <<Network>>
}

websocket <-up-> network: WebSocket

router <-down-> network: WiFi

websocket <-down-> backend
backend <-left-> frontend

frontend -right-> screen: Screen

screen -down-> optical: Color recognition

@enduml
```
-->

![Powered by USB](https://www.plantuml.com/plantuml/dsvg/RLBRYjim47tNLymFcD8KGZ5Bs6ws6nPADzI5FXPV9gvOHIDa6Qyf_VUE9Iieg_Z5HpfdHcSkzuEhhHlF2euqeSKEcXcQsZcqin0jdGrfr0xmZMzqhNwRHGPtTruErMYCcdUxL7eODS1V0VnTBXbfPqaf7_krEdxURBSV-Fzfmy7NqcPqZZJBVbhPzsWpmO1we2NFZyC3LFwGQJev65NFBFgsVuJ7zVHn-nRVCsITr71Tpf4l4nucUP9C_f9FyZgCZ9DjhPXx2IY6_XFYNQiAXITNxC9BPMYp46a_Yj4mlxnLmlAK435zO4Az9Un9qVlGZYPTh2qhuN1yVidv9CNpPd-BZ-qAWXkAp7tiiwNHeP-51yicnAiGcHQM1dun9bkI2Pk1sbTqIy-ngJpEHdkoR0zrnwAd5UOxL7Eebpm4b8oFxS7GMaJDTEL1me96Dv5zPUvxG66gYJS_bQWhuU8qBprgGlL9ZgY8HiN5S5oNMAKG4K5XPV-7kTLz2S6y4E4CQywudEl2WCMMUYsT99RUSwBnhFu3)
