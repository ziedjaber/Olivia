package com.olivia.backend.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an action violates the domain or business rules (e.g., invalid status transition).
 * Returns a 400 BAD REQUEST status to the client.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BusinessLogicException extends RuntimeException {
    
    public BusinessLogicException(String message) {
        super(message);
    }
}
