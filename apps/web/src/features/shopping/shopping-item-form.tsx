"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/modal-shell";
import { apiRequest } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  CreateShoppingItemRequest,
  ShoppingItem,
  ShoppingItemCategory,
  ShoppingItemPriority,
  ShoppingItemUnit,
} from "@/types/shopping";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

interface FamilyMemberOption {
  membershipId: string;
  name: string;
  status: string;
}

interface ShoppingItemFormProps {
  open: boolean;
  loading: boolean;
  initialItem?: ShoppingItem | null;
  onClose: () => void;
  onSubmit: (
    request: CreateShoppingItemRequest,
  ) => Promise<unknown>;
}

interface SelectOption {
  value: string;
  label: string;
}

const categories: SelectOption[] = [
  {
    value: "FOOD",
    label: "Alimentos",
  },
  {
    value: "BEVERAGE",
    label: "Bebidas",
  },
  {
    value: "HYGIENE",
    label: "Higiene",
  },
  {
    value: "CLEANING",
    label: "Limpeza",
  },
  {
    value: "PHARMACY",
    label: "Farmácia",
  },
  {
    value: "BABY",
    label: "Bebê",
  },
  {
    value: "PET",
    label: "Pet",
  },
  {
    value: "HOUSEHOLD",
    label: "Casa",
  },
  {
    value: "CLOTHING",
    label: "Roupas",
  },
  {
    value: "ELECTRONICS",
    label: "Eletrônicos",
  },
  {
    value: "OTHER",
    label: "Outros",
  },
];

const units: SelectOption[] = [
  {
    value: "UNIT",
    label: "Unidade",
  },
  {
    value: "PACKAGE",
    label: "Pacote",
  },
  {
    value: "BOX",
    label: "Caixa",
  },
  {
    value: "BOTTLE",
    label: "Garrafa",
  },
  {
    value: "CAN",
    label: "Lata",
  },
  {
    value: "LITER",
    label: "Litro",
  },
  {
    value: "MILLILITER",
    label: "Mililitro",
  },
  {
    value: "KILOGRAM",
    label: "Quilograma",
  },
  {
    value: "GRAM",
    label: "Grama",
  },
  {
    value: "METER",
    label: "Metro",
  },
  {
    value: "DOZEN",
    label: "Dúzia",
  },
];

const priorities: SelectOption[] = [
  {
    value: "LOW",
    label: "Baixa",
  },
  {
    value: "NORMAL",
    label: "Normal",
  },
  {
    value: "HIGH",
    label: "Alta",
  },
  {
    value: "URGENT",
    label: "Urgente",
  },
];

export function ShoppingItemForm({
  open,
  loading,
  initialItem,
  onClose,
  onSubmit,
}: ShoppingItemFormProps) {
  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState<ShoppingItemCategory>(
      "OTHER",
    );

  const [quantity, setQuantity] =
    useState("1");

  const [unit, setUnit] =
    useState<ShoppingItemUnit>(
      "UNIT",
    );

  const [
    estimatedUnitPrice,
    setEstimatedUnitPrice,
  ] = useState("");

  const [priority, setPriority] =
    useState<ShoppingItemPriority>(
      "NORMAL",
    );

  const [
    assignedToMembershipId,
    setAssignedToMembershipId,
  ] = useState("");

  const [members, setMembers] =
    useState<
      FamilyMemberOption[]
    >([]);

  const [formError, setFormError] =
    useState<string | null>(null);

  const editing =
    Boolean(initialItem);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(
      initialItem?.name ?? "",
    );

    setDescription(
      initialItem?.description ?? "",
    );

    setCategory(
      initialItem?.category ??
        "OTHER",
    );

    setQuantity(
      String(
        initialItem?.quantity ?? 1,
      ),
    );

    setUnit(
      initialItem?.unit ?? "UNIT",
    );

    setEstimatedUnitPrice(
      initialItem
        ?.estimatedUnitPrice != null
        ? String(
            initialItem
              .estimatedUnitPrice,
          )
        : "",
    );

    setPriority(
      initialItem?.priority ??
        "NORMAL",
    );

    setAssignedToMembershipId(
      initialItem
        ?.assignedToMembershipId ??
        "",
    );

    setFormError(null);

    void apiRequest<
      FamilyMemberOption[]
    >("/api/family/members")
      .then((response) => {
        setMembers(
          response.filter(
            (member) =>
              member.status ===
              "ACTIVE",
          ),
        );
      })
      .catch(() => {
        setMembers([]);
      });
  }, [
    initialItem,
    open,
  ]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    const normalizedName =
      name
        .trim()
        .replace(/\s+/g, " ");

    const parsedQuantity =
      Number(
        quantity.replace(",", "."),
      );

    const parsedPrice =
      estimatedUnitPrice.trim()
        ? Number(
            estimatedUnitPrice.replace(
              ",",
              ".",
            ),
          )
        : undefined;

    if (!normalizedName) {
      setFormError(
        "Informe o nome do item.",
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedQuantity,
      ) ||
      parsedQuantity <= 0
    ) {
      setFormError(
        "A quantidade deve ser maior que zero.",
      );

      return;
    }

    if (
      parsedPrice !== undefined &&
      (
        !Number.isFinite(
          parsedPrice,
        ) ||
        parsedPrice < 0
      )
    ) {
      setFormError(
        "Informe um preço estimado válido.",
      );

      return;
    }

    try {
      await onSubmit({
        name: normalizedName,
        description:
          description.trim() ||
          undefined,
        category,
        quantity:
          parsedQuantity,
        unit,
        estimatedUnitPrice:
          parsedPrice,
        priority,
        assignedToMembershipId:
          assignedToMembershipId ||
          undefined,
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
      eyebrow="Item da lista"
      title={
        editing
          ? "Editar item"
          : "Adicionar item"
      }
      titleId="shopping-item-form-title"
      busy={loading}
      size="medium"
      layer="nested"
      onClose={onClose}
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
          {formError && (
            <div
              role="alert"
              className="
                mb-5
                rounded-2xl
                border
                border-rose-400/20
                bg-rose-400/[0.06]
                px-4
                py-3
                text-sm
                text-rose-200
              "
            >
              {formError}
            </div>
          )}

          <fieldset
            disabled={loading}
            className="space-y-5"
          >
            <Input
              label="Item"
              placeholder="Ex.: Leite"
              maxLength={160}
              autoFocus
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
            />

            <div>
              <label
                htmlFor="shopping-item-description"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-zinc-300
                "
              >
                Descrição
              </label>

              <textarea
                id="shopping-item-description"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Opcional"
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.045]
                  px-4
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-zinc-600
                  focus:border-white/30
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Categoria"
                value={category}
                options={categories}
                onChange={(value) =>
                  setCategory(
                    value as ShoppingItemCategory,
                  )
                }
              />

              <SelectField
                label="Prioridade"
                value={priority}
                options={priorities}
                onChange={(value) =>
                  setPriority(
                    value as ShoppingItemPriority,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Quantidade"
                type="number"
                min="0.001"
                step="0.001"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
              />

              <SelectField
                label="Unidade"
                value={unit}
                options={units}
                onChange={(value) =>
                  setUnit(
                    value as ShoppingItemUnit,
                  )
                }
              />
            </div>

            <Input
              label="Preço unitário estimado"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              value={
                estimatedUnitPrice
              }
              onChange={(event) =>
                setEstimatedUnitPrice(
                  event.target.value,
                )
              }
            />

            {members.length > 0 && (
              <SelectField
                label="Responsável"
                value={
                  assignedToMembershipId
                }
                options={[
                  {
                    value: "",
                    label:
                      "Sem responsável",
                  },
                  ...members.map(
                    (member) => ({
                      value:
                        member.membershipId,
                      label:
                        member.name,
                    }),
                  ),
                ]}
                onChange={
                  setAssignedToMembershipId
                }
              />
            )}
          </fieldset>
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
          <Button
            type="button"
            variant="secondary"
            size="large"
            disabled={loading}
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            size="large"
            loading={loading}
          >
            {editing
              ? "Salvar alterações"
              : "Adicionar item"}
          </Button>
        </footer>
      </form>
    </ModalShell>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (
    value: string,
  ) => void;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-medium
          text-zinc-300
        "
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="
          h-12
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#111113]
          px-4
          text-sm
          text-zinc-100
          outline-none
          transition
          focus:border-white/30
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}