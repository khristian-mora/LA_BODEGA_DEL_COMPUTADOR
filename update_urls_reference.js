// Script to update all remaining files with hardcoded localhost URLs
// This will be used as a reference for manual updates

const filesToUpdate = [
    {
        file: 'src/pages/admin/Appointments.jsx',
        urls: [
            "fetch('http://localhost:3000/api/appointments'",
            "fetch('http://localhost:3000/api/customers'",
            "fetch('http://localhost:3000/api/users'",
            "`http://localhost:3000/api/appointments/${editingAppointment.id}`",
            "'http://localhost:3000/api/appointments'",
            "`http://localhost:3000/api/appointments/${appointmentId}`"
        ]
    },
    {
        file: 'src/pages/admin/Warranties.jsx',
        urls: [
            "'http://localhost:3000/api/warranties'",
            "'http://localhost:3000/api/customers'",
            "'http://localhost:3000/api/tickets'",
            "`http://localhost:3000/api/warranties/${editingWarranty.id}`",
            "`http://localhost:3000/api/warranties/${warrantyId}`"
        ]
    },
    {
        file: 'src/pages/admin/Reports.jsx',
        urls: [
            "`http://localhost:3000/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`",
            "'http://localhost:3000/api/reports/inventory'",
            "`http://localhost:3000/api/reports/service?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`",
            "'http://localhost:3000/api/reports/customers'",
            "'http://localhost:3000/api/reports/top-products?limit=5'",
            "`http://localhost:3000/api/reports/appointments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`"
        ]
    },
    {
        file: 'src/pages/admin/Dashboard.jsx',
        urls: [
            "'http://localhost:3000/api/users'",
            "'http://localhost:3000/api/customers'",
            "'http://localhost:3000/api/tickets'",
            "'http://localhost:3000/api/products'"
        ]
    }
];

// Pattern for replacement:
// 1. Add import: import { API_CONFIG } from '../../config/config';
// 2. Replace: 'http://localhost:3000/api/...' with `${API_CONFIG.API_URL}/...`
// 3. Replace: 'http://localhost:3000' with API_CONFIG.BASE_URL

console.log('Files to update:', filesToUpdate.length);
