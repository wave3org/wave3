//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * Un contador simple que permite incrementar y obtener el valor
 * @author wave3
 */
contract Counter {
    // Variable de estado que almacena el contador
    uint256 private count;

    // Evento emitido cuando el contador se incrementa
    event Incremented(uint256 newValue);

    // Constructor: inicializa el contador en 0
    constructor() {
        count = 0;
    }

    /**
     * Función que incrementa el contador en 1
     */
    function increment() public {
        count += 1;
        emit Incremented(count);
    }

    /**
     * Función que retorna el valor actual del contador
     * @return El valor actual del contador
     */
    function getCount() public view returns (uint256) {
        return count;
    }
}

