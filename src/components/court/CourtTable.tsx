
import React from 'react';
import { Court } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';
import { Badge } from "@/components/ui/badge"

interface CourtTableProps {
  courts: Court[];
  onEditCourt: (court: Court) => void;
  onDeleteCourt: (courtId: string) => void;
}

const CourtStatusBadge = ({ status }: { status: CourtStatus }) => {
  let badgeText = "";
  let badgeColor = "bg-gray-100 text-gray-800";

  switch (status) {
    case CourtStatus.AVAILABLE:
      badgeText = "Available";
      badgeColor = "bg-green-100 text-green-800";
      break;
    case CourtStatus.IN_USE:
      badgeText = "In Use";
      badgeColor = "bg-red-100 text-red-800";
      break;
    case CourtStatus.MAINTENANCE:
      badgeText = "Maintenance";
      badgeColor = "bg-yellow-100 text-yellow-800";
      break;
    case CourtStatus.RESERVED:
      badgeText = "Reserved";
      badgeColor = "bg-blue-100 text-blue-800";
      break;
    default:
      badgeText = "Unknown";
      badgeColor = "bg-gray-100 text-gray-800";
      break;
  }

  return (
    <Badge className={badgeColor}>
      {badgeText}
    </Badge>
  );
};

const CourtTable: React.FC<CourtTableProps> = ({ courts, onEditCourt, onDeleteCourt }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Number
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {courts.map((court) => (
            <tr key={court.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4">{court.courtNumber || court.court_number}</td>
              <td className="px-6 py-4">{court.name}</td>
              <td className="px-6 py-4">
                <CourtStatusBadge status={court.status} />
              </td>
              <td className="px-6 py-4 text-right">
                {/* Actions */}
                <button
                  onClick={() => onEditCourt(court)}
                  className="font-medium text-indigo-600 hover:text-indigo-500 mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteCourt(court.id)}
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourtTable;
