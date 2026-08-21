"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FolderTree,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import { financeService } from "./finance-service";
import { FinancialCategoryForm } from "./financial-category-form";

import type {
  CreateFinancialCategoryRequest,
  FinancialCategory,
  FinancialCategoryType,
  UpdateFinancialCategoryRequest,
} from "@/types/finance";

type CategoryFilter = FinancialCategoryType | "ALL";

export function FinanceCategories() {
  const [categories, setCategories] = useState<
    FinancialCategory[]
  >([]);

  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [editing, setEditing] =
    useState<FinancialCategory | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () =>
      filter === "ALL"
        ? categories
        : categories.filter(
            (category) => category.type === filter,
          ),
    [categories, filter],
  );

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setCategories(await financeService.categories.list());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar as categorias.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleSubmit(
    request:
      | CreateFinancialCategoryRequest
      | UpdateFinancialCategoryRequest,
  ) {
    setSubmitting(true);

    try {
      if (editing) {
        await financeService.categories.update(
          editing.id,
          request as UpdateFinancialCategoryRequest,
        );
      } else {
        await financeService.categories.create(
          request as CreateFinancialCategoryRequest,
        );
      }

      setFormOpen(false);
      setEditing(null);
      await loadCategories();
    } finally {
      setSubmitting(false);
    }
  }

  async function executeAction(
    categoryId: string,
    action: () => Promise<FinancialCategory | void>,
  ) {
    setActionId(categoryId);
    setError(null);

    try {
      await action();
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível realizar a ação.",
      );
    } finally {
      setActionId(null);
    }
  }

  function removeCategory(category: FinancialCategory) {
    const confirmed = window.confirm(
      `Deseja excluir a categoria "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    void executeAction(category.id, () =>
      financeService.categories.remove(category.id),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Categorias financeiras
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Organize receitas e despesas
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black"
        >
          <Plus className="size-4" />
          Nova categoria
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            ["ALL", "Todas"],
            ["EXPENSE", "Despesas"],
            ["INCOME", "Receitas"],
          ] as Array<[CategoryFilter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={[
              "h-10 shrink-0 rounded-xl border px-4 text-sm font-medium transition",
              filter === value
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/[0.03] text-zinc-400",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-[1.75rem] border border-white/10">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && filteredCategories.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 text-center">
          <FolderTree className="size-8 text-zinc-600" />

          <p className="mt-4 font-medium text-zinc-300">
            Nenhuma categoria encontrada
          </p>
        </div>
      ) : null}

      {!loading && filteredCategories.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((category) => {
            const processing = actionId === category.id;

            return (
              <article
                key={category.id}
                className={[
                  "rounded-[1.5rem] border p-5 transition",
                  category.active
                    ? "border-white/10 bg-white/[0.035]"
                    : "border-white/[0.06] bg-white/[0.015] opacity-60",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10"
                      style={{
                        backgroundColor: category.color
                          ? `${category.color}20`
                          : undefined,
                        color: category.color ?? undefined,
                      }}
                    >
                      <FolderTree className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {category.name}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        {category.type === "EXPENSE"
                          ? "Despesa"
                          : "Receita"}
                        {!category.active ? " • Inativa" : ""}
                      </p>
                    </div>
                  </div>

                  {processing ? (
                    <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => {
                          setEditing(category);
                          setFormOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        title={
                          category.active
                            ? "Desativar"
                            : "Ativar"
                        }
                        onClick={() =>
                          void executeAction(category.id, () =>
                            category.active
                              ? financeService.categories.deactivate(
                                  category.id,
                                )
                              : financeService.categories.activate(
                                  category.id,
                                ),
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Power className="size-4" />
                      </button>

                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => removeCategory(category)}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {category.icon ? (
                  <p className="mt-4 truncate rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 font-mono text-xs text-zinc-600">
                    {category.icon}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {formOpen ? (
        <FinancialCategoryForm
          key={editing?.id ?? "new-category"}
          category={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!submitting) {
              setFormOpen(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}