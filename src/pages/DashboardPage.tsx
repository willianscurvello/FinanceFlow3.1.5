import React, { useEffect, useState } from 'react';
import { BarChart, DollarSign, Users, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Importar o cliente Supabase

interface Expense {
  id: number;
  amount: number;
  employee_id: string;
}

interface Employee {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
}

export function DashboardPage() {
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [activeEmployees, setActiveEmployees] = useState<number>(0);
  const [topSpenders, setTopSpenders] = useState<{ employee: Employee; total: number }[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(''); // Estado para a empresa selecionada

  useEffect(() => {
    fetchTotalExpenses();
    fetchActiveEmployees();
    fetchTopSpenders();
    fetchCompanies(); // Carregar empresas ao montar o componente
  }, []);

  const fetchTotalExpenses = async () => {
    const { data, error } = await supabase.from('expenses').select('amount');
    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      const total = data.reduce((acc: number, expense: { amount: number }) => acc + expense.amount, 0);
      setTotalExpenses(total);
    }
  };

  const fetchActiveEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setActiveEmployees(data.length); // Contar o número de empregados
    }
  };

  const fetchTopSpenders = async () => {
    const { data: expenses, error } = await supabase.from('expenses').select('*');
    if (error) {
      console.error('Error fetching expenses:', error);
      return;
    }

    const employeeIds = expenses.map((expense: Expense) => expense.employee_id);
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .in('id', employeeIds);

    if (employeeError) {
      console.error('Error fetching employees:', employeeError);
      return;
    }

    const expenseTotals = expenses.reduce((acc: { [key: string]: number }, expense: Expense) => {
      acc[expense.employee_id] = (acc[expense.employee_id] || 0) + expense.amount;
      return acc;
    }, {});

    const topSpendersData = employees.map((employee: Employee) => ({
      employee,
      total: expenseTotals[employee.id] || 0,
    })).sort((a, b) => b.total - a.total).slice(0, 5); // Top 5 spenders

    setTopSpenders(topSpendersData);
  };

  const fetchCompanies = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId); // Filtrar empresas pelo user_id

    if (error) {
      console.error('Error fetching companies:', error);
    } else {
      setCompanies(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-4">
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              fetchTopSpenders(); // Atualizar os top spenders com base na empresa selecionada
            }} // Atualizar a empresa selecionada
            className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Todas as Empresas</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="+12.5%"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Active Employees"
          value={activeEmployees.toString()}
          change="+3.2%"
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Companies"
          value={companies.length.toString()} // Atualizar para mostrar o número de empresas
          change="0%"
          icon={Building2}
          trend="neutral"
        />
        <MetricCard
          title="Pending Approvals"
          value="23"
          change="-5.1%"
          icon={BarChart}
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Spenders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topSpenders.map(({ employee, total }) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Trends</h2>
          <div className="h-80 flex items-center justify-center text-gray-500">
            Chart will be implemented here
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}) {
  const trendColor = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  }[trend];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
          <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
      </div>
      <p className={`mt-4 text-sm ${trendColor}`}>{change} from last period</p>
    </div>
  );
}
