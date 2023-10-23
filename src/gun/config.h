// PIN Configuration
#define LED_PIN  LED_BUILTIN
#define TRIG_PIN D4

// Serial Settings
#define BAUD_RATE 74880 // Bootloader have the same baud rate

// LCD Settings
#define LCD_COLS 16
#define LCD_ROWS 2

// Wi-Fi Settings
#define WIFI_CONNECT_TIMEOUT (20 * 1000)
// Wi-Fi Settings Struct
struct WiFiSettings {
    char    ssid[0x20] = "";
    char    pass[0x20] = "";
    uint8_t mode       = WIFI_AP;
};

// WebSocket Settings
#define WS_PORT     81
#define WS_PROTOCOL "QuackHuntGun"

// #define DEBUG