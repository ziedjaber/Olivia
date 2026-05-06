package com.olivia.backend.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an authenticated user attempts an action they do not have permission for (e.g., wrong role).
 * Returns a 403 FORBIDDEN status to the client.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class UnauthorizedActionException extends RuntimeException {
    
    public UnauthorizedActionException(String message) {
        super(message);
    }
}
