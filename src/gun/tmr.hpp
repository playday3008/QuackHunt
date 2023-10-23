#pragma once
#include <Arduino.h>

/// @brief Timer class
class Tmr {
  public:
    /// @brief Constructor
    Tmr() {}
    /// @brief Constructor
    /// @param ms Timer period in milliseconds
    Tmr(uint16_t ms) { start(ms); }

    /// @brief Start the timer
    /// @param ms Timer period in milliseconds
    void start(uint16_t ms) {
        _prd = ms;
        if (_prd)
            start();
    }

    /// @brief Start the timer
    void start() {
        if (!_prd)
            return;
        _tmr = millis();
        if (!_tmr)
            _tmr = 1;
    }

    /// @brief Set the timer mode
    void timerMode(bool mode) { _mode = mode; }

    /// @brief Stop the timer
    void stop() { _tmr = 0; }

    /// @brief Get the timer state
    bool state() { return _tmr; }

    /// @brief Check if the timer has expired
    bool tick() {
        return (_tmr && millis() - _tmr >= _prd)
                   ? ((_mode ? stop() : start()), true)
                   : false;
    }

    /// @brief Check if the timer has expired
    operator bool() { return tick(); }

  private:
    uint32_t _tmr = 0, _prd = 0;
    bool     _mode = 0;
};
