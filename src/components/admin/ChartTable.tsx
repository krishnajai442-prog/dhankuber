"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Edit, Trash2, Eye, Star, Replace } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Modal, ConfirmModal } from "@/components/shared/Modal";
import { fmtTimeLabel } from "@/lib/markets";

/* ---------------------------------- types --------------------------------- */

interface ChartData {
  id: string;
  chartName: string;
  result: string;
  date: number;
  month: number;
  year: number;
  displayOrder: number;
  isHighlighted: boolean;
  isActive: boolean;
  formattedDate: string;
  scheduledAt?: string;
  createdAt: Date;
  updatedAt: Date;
  stale?: boolean;
  drawTime?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ChartTableProps {
  charts: ChartData[];
  isLoading?: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onEdit: (chart: ChartData) => void;
  onDelete: (chart: ChartData) => void;
  onToggleHighlight: (chart: ChartData) => void;
  onToggleActive: (chart: ChartData) => void;
  onView: (chart: ChartData) => void;
  onRowClick?: (chart: ChartData) => void;
}

const COLUMNS = ["Chart", "Date", "Result", "Order", "Scheduled", "Updated", "Status", "Actions"];

/* -------------------------------- component ------------------------------- */

export function ChartTable({
  charts,
  isLoading,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onToggleHighlight,
  onToggleActive,
  onView,
  onRowClick,
}: ChartTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<ChartData | null>(null);
  const [renameTarget, setRenameTarget] = useState<ChartData | null>(null);
  const [deleteMarketTarget, setDeleteMarketTarget] = useState<ChartData | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeletingMarket, setIsDeletingMarket] = useState(false);

  /* -------------------------------- handlers ------------------------------- */

  const handleDeleteClick = (chart: ChartData) => setDeleteConfirm(chart);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  const openRename = (chart: ChartData) => {
    setRenameTarget(chart);
    setNewName(chart.chartName);
  };

  /** Renames EVERY entry of this market (all dates) via the admin API. */
  const handleRename = async () => {
    if (!renameTarget) return;
    const name = newName.trim();
    if (!name || name === renameTarget.chartName) return;

    setIsRenaming(true);
    try {
      const res = await fetch("/api/admin/charts/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: renameTarget.chartName, newName: name }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRenameTarget(null);
        setNewName("");
        onPageChange(pagination.page); // refresh the list
      } else {
        alert(data.message || "Failed to rename market");
      }
    } catch {
      alert("An error occurred while renaming");
    } finally {
      setIsRenaming(false);
    }
  };

  /** Deletes ALL entries of this market across all dates. */
  const handleDeleteMarket = async () => {
    if (!deleteMarketTarget) return;
    setIsDeletingMarket(true);
    try {
      const res = await fetch("/api/admin/charts/delete-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketName: deleteMarketTarget.chartName }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setDeleteMarketTarget(null);
        setNewName("");
        onPageChange(pagination.page); // refresh the list
      } else {
        alert(data.message || "Failed to delete market");
      }
    } catch {
      alert("An error occurred while deleting");
    } finally {
      setIsDeletingMarket(false);
    }
  };

  /* ------------------------------ loading state ---------------------------- */

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table" role="table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c} scope="col">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {COLUMNS.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* --------------------------------- render -------------------------------- */

  return (
    <div className="card overflow-hidden">
      <div className="table-container">
        <table className="table" role="table">
          <thead>
            <tr>
              <th scope="col" className="w-48">Chart</th>
              <th scope="col" className="w-32">Date</th>
              <th scope="col">Result</th>
              <th scope="col" className="w-24">Order</th>
              <th scope="col" className="w-40">Scheduled</th>
              <th scope="col" className="w-40">Updated</th>
              <th scope="col" className="w-40">Status</th>
              <th scope="col" className="w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charts.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500">No charts found</p>
                  </div>
                </td>
              </tr>
            ) : (
              charts.map((chart) => (
                <tr
                  key={chart.id}
                  onClick={() => onRowClick?.(chart)}
                  className={clsx(
                    chart.isHighlighted && "highlighted",
                    onRowClick && "cursor-pointer transition-colors hover:bg-gray-50"
                  )}
                >
                  <td className="font-medium text-gray-900">
                    {chart.chartName}
                    {chart.drawTime && (
                      <span className="badge badge-primary ml-2">{fmtTimeLabel(chart.drawTime)}</span>
                    )}
                    {chart.stale && <span className="badge badge-warning ml-2">Needs update</span>}
                  </td>
                  <td className="whitespace-nowrap text-gray-600">{chart.formattedDate}</td>
                  <td className="font-mono text-lg font-bold text-primary-700">
                    {chart.result ? chart.result : <span className="badge badge-warning">Pending</span>}
                  </td>
                  <td className="text-gray-600">{chart.displayOrder}</td>
                  <td className="whitespace-nowrap text-sm text-gray-500">
                    {chart.scheduledAt ? new Date(chart.scheduledAt).toLocaleString() : "Immediate"}
                  </td>
                  <td className="whitespace-nowrap text-sm text-gray-500">
                    {chart.updatedAt ? new Date(chart.updatedAt).toLocaleString() : "-"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(chart)}
                        className="h-8 px-2 py-1"
                        aria-label={chart.isActive ? "Deactivate" : "Activate"}
                      >
                        {chart.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Inactive</span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleHighlight(chart)}
                        className="h-8 px-2 py-1"
                        aria-label={chart.isHighlighted ? "Remove highlight" : "Highlight"}
                      >
                        {chart.isHighlighted ? (
                          <span className="badge badge-warning flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Highlighted
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-500">Normal</span>
                        )}
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(chart)}
                        className="h-8 w-8 p-0"
                        aria-label="View details"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRename(chart)}
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        aria-label="Rename market (all entries)"
                        title="Rename all entries of this market"
                      >
                        <Replace className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(chart)}
                        className="h-8 w-8 p-0"
                        aria-label="Edit this entry"
                        title="Edit this single entry"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(chart)}
                        className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50"
                        aria-label="Delete this entry"
                        title="Delete this single entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteMarketTarget(chart);
                          setNewName("");
                        }}
                        className="h-8 w-8 p-0 text-red-700 hover:bg-red-100"
                        aria-label="Delete entire market (all entries)"
                        title="Delete ALL entries of this market across all dates"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* rename market modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => {
          setRenameTarget(null);
          setNewName("");
        }}
        title={`Rename Market: ${renameTarget?.chartName ?? ""}`}
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          This renames <strong>every entry</strong> of this market across all dates — history, monthly
          charts and the public tables update together.
        </p>
        <Input
          label="New Market Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter new name"
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRenameTarget(null);
              setNewName("");
            }}
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleRename}
            loading={isRenaming}
            disabled={!newName.trim() || newName.trim() === renameTarget?.chartName}
          >
            Rename All
          </Button>
        </div>
      </Modal>

      {/* delete single entry confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Entry"
        message={`Are you sure you want to delete "${deleteConfirm?.chartName}" for ${deleteConfirm?.formattedDate}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* delete entire market modal */}
      <Modal
        isOpen={!!deleteMarketTarget}
        onClose={() => {
          setDeleteMarketTarget(null);
          setNewName("");
        }}
        title={`Delete Entire Market: ${deleteMarketTarget?.chartName ?? ""}`}
        size="sm"
      >
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-800">⚠️ WARNING: Destructive Action</p>
          <p className="mt-2 text-sm text-red-700">
            This will delete <strong>ALL entries</strong> of &quot;{deleteMarketTarget?.chartName}&quot; across
            <strong> all dates</strong> — the entire history will be permanently removed.
          </p>
          <p className="mt-2 text-sm text-red-700">
            This action <strong>cannot be undone</strong>.
          </p>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Type the market name to confirm deletion:
        </p>
        <Input
          label={`Type "${deleteMarketTarget?.chartName}" to confirm`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={deleteMarketTarget?.chartName}
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDeleteMarketTarget(null);
              setNewName("");
            }}
            disabled={isDeletingMarket}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDeleteMarket}
            loading={isDeletingMarket}
            disabled={newName.trim() !== deleteMarketTarget?.chartName}
          >
            Delete Entire Market
          </Button>
        </div>
      </Modal>
    </div>
  );
}