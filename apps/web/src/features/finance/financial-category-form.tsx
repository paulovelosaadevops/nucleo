"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import type {
  CreateFinancialCategoryRequest,
  FinancialCategory,
  FinancialCategoryType,
  UpdateFinancialCategoryRequest,
} from "@/types/finance";

type CategoryFormRequest =
  | CreateFinancialCategoryRequest
  | UpdateFinancialCategoryRequest;

interface FinancialCategoryFormProps {
  category?: FinancialCategory | null;
  submitting?: boolean;
  onSubmit: (request: CategoryFormRequest) => Promise<void>;
  onCancel: () => void;
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25";

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500";

export function FinancialCategoryForm({
  category,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialCategoryFormProps) {
  const editing = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<FinancialCategoryType>(
    category?.type ?? "EXPENSE",
  );

  const [color, setColor] = useState(
    category?.color ?? "#A1A1AA",
  );

  const [icon, setIcon] = useState(category?.icon ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      setError("Informe um nome válido para a categoria.");
      return;
    }

    try {
      if (editing) {
        const request: UpdateFinancialCategoryRequest = {
          name: normalizedName,
          color: color || null,
          icon: icon.trim() || null,
        };

        await onSubmit(request);
        return;
      }

      const request: CreateFinancialCategoryRequest = {
        name: normalizedName,
        type,
        color: color || null,
        icon: icon.trim() || null,
      };

      await onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar a categoria.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] sm:max-w-xl sm:rounded-[2rem]">
        <header className="flex items-start justify-between border-b border-white/10 p-5 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Finanças
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {editing ? "Editar categoria" : "Nova categoria"}
            </h2>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
          >
            <X className="size-4" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-7"
        >
          {!editing ? (
            <fieldset disabled={submitting}>
              <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Tipo
              </legend>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-1.5">
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={[
                    "h-11 rounded-xl text-sm font-semibold transition",
                    type === "EXPENSE"
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:bg-white/[0.05] hover:text-white",
                  ].join(" ")}
                >
                  Despesa
                </button>

                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={[
                    "h-11 rounded-xl text-sm font-semibold transition",
                    type === "INCOME"
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:bg-white/[0.05] hover:text-white",
                  ].join(" ")}
                >
                  Receita
                </button>
              </div>
            </fieldset>
          ) : (
            <div>
              <span className={labelClassName}>Tipo</span>

              <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-white/[0.025] px-4 text-sm text-zinc-400">
                {type === "EXPENSE" ? "Despesa" : "Receita"}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="category-name"
              className={labelClassName}
            >
              Nome
            </label>

            <input
              id="category-name"
              value={name}
              maxLength={80}
              autoFocus
              disabled={submitting}
              placeholder={
                type === "EXPENSE"
                  ? "Ex.: Supermercado"
                  : "Ex.: Salário"
              }
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="category-icon"
              className={labelClassName}
            >
              Ícone
            </label>

            <input
              id="category-icon"
              value={icon}
              maxLength={40}
              disabled={submitting}
              placeholder="Ex.: shopping-cart"
              onChange={(event) => setIcon(event.target.value)}
              className={inputClassName}
            />

            <p className="mt-2 text-xs text-zinc-600">
              Identificador opcional para uso visual.
            </p>
          </div>

          <div>
            <label
              htmlFor="category-color"
              className={labelClassName}
            >
              Cor
            </label>

            <div className="flex gap-3">
              <input
                id="category-color"
                type="color"
                value={color}
                disabled={submitting}
                onChange={(event) => setColor(event.target.value)}
                className="h-12 w-16 rounded-xl border border-white/10 bg-white/[0.04] p-2"
              />

              <input
                value={color}
                maxLength={7}
                disabled={submitting}
                onChange={(event) => setColor(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <footer className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="h-11 rounded-2xl border border-white/10 px-5 text-sm font-semibold text-zinc-300"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-black disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}

              {editing ? "Salvar alterações" : "Criar categoria"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}