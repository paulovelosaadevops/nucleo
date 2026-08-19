package br.com.nucleo.api.common.error;

public class AgendaConflictException extends RuntimeException {

    public AgendaConflictException(String message) {
        super(message);
    }
}