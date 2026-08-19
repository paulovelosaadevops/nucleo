package br.com.nucleo.api.common.error;

public class AccountUnavailableException extends RuntimeException {

    public AccountUnavailableException() {
        super("Esta conta não está disponível para acesso");
    }
}