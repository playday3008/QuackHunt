#pragma once
#include <Arduino.h>

/// @brief Led class
class Led {
  public:
    /// @brief Constructor
    /// @param pin Pin number
    /// @note
    ///   The pin will be configured as output.
    Led(uint8_t pin) : _pin(pin) { pinMode(_pin, OUTPUT); }

    /// @brief Turn on the led
    void on() { write(1); }

    /// @brief Turn off the led
    void off() { write(0); }

    /// @brief Toggle the led state
    void toggle() { write(!_state); }

    /// @brief Get the led state
    bool state() { return _state; }

  private:
    /// @brief Write the led state
    void write(bool state) {
        digitalWrite(_pin, state);
        _state = state;
    }

  private:
    uint8_t _pin;
    bool    _state = 0;
};
