import { useEffect } from 'react';
import { useVehicleStore } from '../store/vehicleStore';
import { toast } from '@/hooks/use-toast';

export function AlertSystem() {
  const services = useVehicleStore((state) => state.services);

  // Check service overdue on mount
  useEffect(() => {
    const overdueServices = services.filter(s => s.status === 'OVERDUE');
    if (overdueServices.length > 0) {
      setTimeout(() => {
        toast({
          title: 'Service Overdue',
          description: `You have ${overdueServices.length} overdue service item(s).`,
          variant: 'destructive',
        });
      }, 2000);
    }
  }, [services]);

  return null;
}
