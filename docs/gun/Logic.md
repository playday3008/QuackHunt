# QuackHunt Gun Logic

<!---
```plantuml
@startuml Gun Logic

actor "User" as user
participant "Controller" as controller
participant "Button" as button
participant "LED" as led
participant "RGB Sensor" as rgb_sensor
participant "UART" as uart
participant "LCD Display" as lcd

== Setup ==
user -> controller: Power Up
activate controller
activate controller
controller -> controller: Initialize global variables
activate button
activate button
activate led
activate led
activate rgb_sensor
activate rgb_sensor
controller -> uart: Initialize UART with 74880 baud rate
activate uart
activate uart
controller -> lcd: Initialize LCD with RGB backlight as white
activate lcd
activate lcd
controller -> controller: Initialize File System
group Wi-Fi Subroutine
    controller -> controller: Get Wi-Fi credentials from File System
    controller -> controller: Check if Wi-Fi credentials are valid
    alt Wi-Fi credentials are valid
        controller -> lcd: Show connection progress
        controller -> controller: Connect to Wi-Fi
        alt Wi-Fi connection failed
            controller -> controller: Go to Wi-Fi Portal Setup
        end
    end
    opt User decides
        user -> button: Press button
    end
    controller <- button: Read button state
    alt Wi-Fi is not connected || Wi-Fi credentials are not valid || Button is pressed
        controller -> controller: Launch Wi-Fi Portal Setup
        controller -> controller: Get Wi-Fi credentials from Wi-Fi Portal Setup
        controller -> controller: Save Wi-Fi credentials to File System
        controller -> controller: Reboot
        deactivate rgb_sensor
        deactivate led
        deactivate button
        deactivate lcd
        deactivate uart
        deactivate controller
    end
end
group WebSocket Subroutine
    controller -> controller: Launch WebSocket
    controller -> controller: Setup WebSocket callbacks
    group WebSocket Callbacks
        group On WebSocket connected
            controller -> controller: Assign connection ID to global variable
            controller -> led: Turn on LED
            controller -> controller: Send WebSocket message with hardware specs
        end
        group On WebSocket message received
            controller -> lcd: Show received message
        end
    end
end

== Main Loop ==
controller -> controller: WebSocket Tick
controller -> controller: Check if WebSocket is connected
alt WebSocket is not connected
    controller -> led: Blink LED
end
opt User decides
    user -> button: Press/Hold button (Shoot)
end
controller <- button: Read button state
alt Button is pressed
    controller <- rgb_sensor: Read RGB sensor data
    controller -> controller: Send WebSocket message with color data and shot set to true
else Button is holded
    controller <- rgb_sensor: Read RGB sensor data
    controller -> controller: Send WebSocket message with color data and shot set to false
end
deactivate rgb_sensor
deactivate led
deactivate button
deactivate lcd
deactivate uart
deactivate controller

@enduml
```
-->

![Gun Logic](https://www.plantuml.com/plantuml/dsvg/pLL1Roid4BxlhnZbr1wYzb2fJrLTlHUxBusKgfKtKOyL2-DTP0mhcBMLAZ--i3YBsUBOogcMekp0pCV7D_3nsH6pDEmKt0yQ7aqhULKnJiR2pRD3UmFCmU0_gjxdIIvxfWbkbaQJDKeT4_WKvcbt0v7HOqepVkRJZx-knZc58fzOtzz1ZTgP26_RvcyNmXdyyvVrKoJeHsVGonMifEiLUubBS55LYuL7fQ67nQ8AUuBRNqwe_mH_ceCVVEw307BF24zcYsFfSmxre2L9fkG_2Aqo3LEmPrQoHg5BI56Jyt7GfHmaHOfZEQ-WJiOew0O7IHty-CEdJzz3mmO1rcCai52JHpbe43J3z897oD2xXl6jacr7GVf39q-GGs4UN2NYLwaGwXT7kAjQQtmF_vAtNoNKG-CZaXehyB_pMFT8nn9kKQ0Em0usrkmoxFT1bXtoBSXD0ObPX3rJKemGJD75dF0hQ5ftvX36DNAIHaDlJMlHkRocJ2zM0PcuU2p9wIJW3PCA4vKByfa9rLyJIqp5gpILemvGwR_f2OA1W40k1IRwRnSl7dP_wSBcZb52oCdyV3kbhv69Om2E6E5CR-b06thR9mfuVIrt8gJ5ReIKw5IXkWzyK5mXzoCRDE_EY_B1u_WXl9hjiG189Z_T5t7Ms1X3KwB0WhsKPXMAqd1iLB605mk2qvJ64yVfZ8I_enLWKnk-HRhU3cBlKkM5z1efMuSpfOB9nMCzPx7CPbF67pebfHDwvGtyufnizUa5VbW1cVdpyWwQGcylJuFLu8lzstlbmZLgSS9xXywn5gFPTyoAGxXChaVkCZCeRZs7iCXHxWiA52nnIdwhBZeFwlZC_ywatw8nurD_Vck9qfFas-eAuqyLqfsqa2dAfd8Fgixquav9lGsT67aN7RFebj_zPjHaWjzuTGnzEq9SQvc1RjdnSeHqvoFA-BZ70H2CMFNnayEDEe80yrckC-IHnxUBx80LAeSd73kZnF-8ueOfXwFaPOUSEUD_7N7cX7C7B3jVzHcr67RgNm00)
