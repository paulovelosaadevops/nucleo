package br.com.nucleo.api.common.error;

public class InvitationConflictException extends RuntimeException {

    public InvitationConflictException(String message) {
        super(message);
    }
}