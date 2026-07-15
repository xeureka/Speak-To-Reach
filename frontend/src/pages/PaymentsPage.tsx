import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function PaymentsPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const payments = useQuery({ queryKey: ['payments', month], queryFn: () => api.payments({ month }), retry: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Payments</h1>
          <p className="text-muted-foreground mt-1">Monthly activity and payment audit.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="flex h-10 rounded-xl border border-border bg-background px-3.5 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
          />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity Summary &mdash; {month}</CardTitle></CardHeader>
        <CardContent>
          {payments.isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>}
          {payments.data && payments.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No activity recorded for this month.</p>}
          {payments.data && payments.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Classes Taught</TableHead><TableHead>Reports Submitted</TableHead><TableHead>Total Hours</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.data.map(p => (
                  <TableRow key={p.teacherId}>
                    <TableCell className="font-medium">{p.teacherName}</TableCell>
                    <TableCell>{p.classesTaught}</TableCell>
                    <TableCell>{p.reportsSubmitted}</TableCell>
                    <TableCell>{p.totalHours}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
