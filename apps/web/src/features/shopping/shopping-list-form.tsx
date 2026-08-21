"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { getErrorMessage } from "@/lib/api/api-error";

import type {
  CreateShoppingListRequest,
  ShoppingListDetails,
} from "@/types/shopping";

import { LoaderCircle } from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

interface ShoppingListFormProps {
  open: boolean;
  loading: boolean;
  initialList?: ShoppingListDetails | null;
  onClose: () => void;
  onSubmit: (
    request: CreateShoppingListRequest,
  ) => Promise<unknown>;
}

const inputClassName = [
  "h-12 w-full rounded-2xl border border-white/10",
  "bg-white/[0.04] px-4 text-sm text-white outline-none",
  "transition placeholder:text-zinc-600",
  "focus:border-white/25 focus:bg-white/[0.065]",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500";

export function ShoppingListForm({
  open,
  loading,
  initialList,
  onClose,
  onSubmit,
}: ShoppingListFormProps) {
  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [formError, setFormError] =
    useState<string | null>(null);

  const editing = Boolean(initialList);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(
      initialList?.name ?? "",
    );

    setDescription(
      initialList?.description ?? "",
    );

    setDueDate(
      initialList?.dueDate ?? "",
    );

    setFormError(null);
  }, [
    initialList,
    open,
  ]);

  function handleClose() {
    if (loading) {
      return;
    }

    setFormError(null);
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    const normalizedName =
      name.trim().replace(/\s+/g, " ");

    if (normalizedName.length < 2) {
      setFormError(
        "Informe um nome com pelo menos 2 caracteres.",
      );
      return;
    }

    try {
      await onSubmit({
        name: normalizedName,
        description:
          description.trim() || undefined,
        dueDate:
          dueDate || undefined,
      });

      onClose();
    } catch (error) {
      setFormError(
        getErrorMessage(error),
      );
    }
  }

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      eyebrow="Compras"
      title={
        editing
          ? "Editar lista"
          : "Nova lista"
      }
      titleId="shopping-list-form-title"
      busy={loading}
      onClose={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        className="
          flex
          min-h-0
          flex-1
          flex-col
        "
      >
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            p-5
            sm:p-7
          "
        >
          <fieldset
            disabled={loading}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="shopping-list-name"
                className={labelClassName}
              >
                Nome da lista
              </label>

              <input
                id="shopping-list-name"
                type="text"
                value={name}
                maxLength={120}
                autoFocus
                placeholder="Ex.: Compras do mês"
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="shopping-list-description"
                className={labelClassName}
              >
                Descrição
              </label>

              <textarea
                id="shopping-list-description"
                rows={4}
                maxLength={500}
                value={description}
                placeholder="Informações adicionais sobre a lista"
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-white
                  outline-none
                  transition
                  placeholder:text-zinc-600
                  focus:border-white/25
                  focus:bg-white/[0.065]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />
            </div>

            <div>
              <label
                htmlFor="shopping-list-due-date"
                className={labelClassName}
              >
                Data limite
              </label>

              <input
                id="shopping-list-due-date"
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(
                    event.target.value,
                  )
                }
                className={inputClassName}
              />
            </div>
          </fieldset>

          {formError ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm leading-6 text-rose-200"
            >
              {formError}
            </div>
          ) : null}
        </div>

        <footer
          className="
            flex
            shrink-0
            flex-col-reverse
            gap-2
            border-t
            border-white/10
            bg-[#090909]/95
            p-5
            backdrop-blur-xl
            sm:flex-row
            sm:justify-end
            sm:px-7
          "
        >
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="
              h-11
              rounded-2xl
              border
              border-white/10
              px-5
              text-sm
              font-semibold
              text-zinc-300
              transition
              hover:bg-white/[0.06]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-white
              px-6
              text-sm
              font-semibold
              text-black
              transition
              hover:bg-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}

            {editing
              ? "Salvar alterações"
              : "Criar lista"}
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}