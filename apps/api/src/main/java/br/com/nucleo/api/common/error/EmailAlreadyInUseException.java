package br.com.nucleo.api.common.error;

public class EmailAlreadyInUseException extends RuntimeException {

    public EmailAlreadyInUseException() {
        super("Já existe uma conta cadastrada com este e-mail");
    }
}