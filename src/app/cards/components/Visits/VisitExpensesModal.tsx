import {
  Button,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  NumberInput,
  Select,
  Text,
  TextArea,
  useExtensionActions,
} from "@hubspot/ui-extensions";
import { useCallback, useEffect, useState } from "react";

import { addExpense, deleteExpense, fetchVisitDetail } from "../services/visitsApi";
import { EXPENSE_CATEGORIES, Visit, VisitExpense, ExpenseCategory } from "../types/visit";
import { emptyExpenseForm } from "./visitFormHelpers";

interface Props {
  visit: Visit;
  onSaved: () => void;
}

interface ExtensionActions {
  addAlert: (alert: { type: "success" | "danger"; message: string }) => void;
  closeOverlay?: (id: string) => void;
}

export default function VisitExpensesModal({ visit, onSaved }: Props) {
  const modalId = `visit-expenses-modal-${visit.id}`;
  const { addAlert, closeOverlay } = useExtensionActions() as ExtensionActions;
  const [expenses, setExpenses] = useState<VisitExpense[]>([]);
  const [form, setForm] = useState(emptyExpenseForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadExpenses = useCallback(async () => {
    const detail = await fetchVisitDetail(visit.id);
    setExpenses(detail.expenses);
  }, [visit.id]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      const detail = await fetchVisitDetail(visit.id);
      if (active) {
        setExpenses(detail.expenses);
      }
    });

    return () => {
      active = false;
    };
  }, [visit.id]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) < 0) {
      addAlert({ type: "danger", message: "Montant de dépense invalide." });
      return;
    }

    setIsSaving(true);
    try {
      await addExpense(visit.id, form);
      setForm(emptyExpenseForm);
      await loadExpenses();
      onSaved();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible d'ajouter la dépense.";
      addAlert({ type: "danger", message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      await loadExpenses();
      onSaved();
    } catch {
      addAlert({ type: "danger", message: "Impossible de supprimer la dépense." });
    }
  };

  return (
    <Modal id={modalId} title="Dépenses de visite" width="md">
      <ModalBody>
        <Flex direction="column" gap="md">
          <Text format={{ fontWeight: "bold" }}>Total: {total.toFixed(2)} MAD</Text>

          {expenses.length === 0 ? (
            <Text>Aucune dépense enregistrée.</Text>
          ) : (
            <Flex direction="column" gap="sm">
              {expenses.map((expense) => (
                <Flex key={expense.id} direction="row" justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: "bold" }}>
                      {expense.category} - {expense.amount.toFixed(2)} {expense.currency}
                    </Text>
                    <Text variant="microcopy">{expense.description || "Sans description"}</Text>
                  </Flex>
                  <Button
                    variant="transparent"
                    size="xs"
                    onClick={() => void handleDelete(expense.id)}
                  >
                    Supprimer
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}

          <Divider />

          <Form>
            <Flex direction="column" gap="md">
              <Select
                label="Catégorie"
                name="category"
                value={form.category}
                options={EXPENSE_CATEGORIES.map((category) => ({ label: category, value: category }))}
                onChange={(value) => setForm({ ...form, category: String(value) as ExpenseCategory })}
              />
              <NumberInput
                label="Montant"
                name="amount"
                min={0}
                precision={2}
                value={form.amount ? Number(form.amount) : undefined}
                onChange={(value) => setForm({ ...form, amount: String(value) })}
              />
              <Input
                label="Devise"
                name="currency"
                value={form.currency}
                onChange={(value) => setForm({ ...form, currency: value })}
              />
              <TextArea
                label="Description"
                name="description"
                value={form.description}
                rows={2}
                onChange={(value) => setForm({ ...form, description: value })}
              />
            </Flex>
          </Form>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Flex direction="row" gap="sm" justify="end">
          <Button variant="secondary" onClick={() => closeOverlay?.(modalId)}>
            Fermer
          </Button>
          <Button variant="primary" disabled={isSaving} onClick={() => void handleAdd()}>
            Ajouter
          </Button>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}
