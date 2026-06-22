import { useEffect, useRef } from 'react';
import { useVehicleStore } from '../store/vehicleStore';
import { toast } from '@/hooks/use-toast';

export function AlertSystem() {
  const sensorData = useVehicleStore((state) => state.sensorData);
  const services = useVehicleStore((state) => state.services);
  
  const lastAlertsRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    const checkAlerts = () => {
      const now = Date.now();
      const lastAlerts = lastAlertsRef.current;
      const ALER_COOLDOWN = 60000; // 1 minute between same alert
      
      const fireAlert = (id: string, title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
        if (!lastAlerts[id] || now - lastAlerts[id] > ALER_COOLDOWN) {
          toast({
            title,
            description,
            variant,
          });
          lastAlerts[id] = now;
          
          try {
            if (variant === 'destructive') {
               // Optional: subtle beep
               const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
               audio.volume = 0.2;
               audio.play().catch(e => console.log('Audio play blocked'));
            }
          } catch(e) {}
        }
      };

      // Doors open while moving
      if (sensorData.speed > 0) {
        if (sensorData.driverDoor) fireAlert('door-driver', 'Driver Door Open!', 'Vehicle is in motion with door open.', 'destructive');
        if (sensorData.passengerDoor) fireAlert('door-pass', 'Passenger Door Open!', 'Vehicle is in motion with door open.', 'destructive');
        if (sensorData.rearLeftDoor) fireAlert('door-rl', 'Rear Left Door Open!', 'Vehicle is in motion with door open.', 'destructive');
        if (sensorData.rearRightDoor) fireAlert('door-rr', 'Rear Right Door Open!', 'Vehicle is in motion with door open.', 'destructive');
        if (sensorData.boot) fireAlert('door-boot', 'Boot Open!', 'Vehicle is in motion with boot open.', 'destructive');
        if (sensorData.bonnet) fireAlert('door-bonnet', 'Bonnet Open!', 'Vehicle is in motion with bonnet open.', 'destructive');
      }

      // Cabin temp
      if (sensorData.cabinTemp > 40) {
        fireAlert('temp-high', 'High Cabin Temperature', `Cabin temp is ${sensorData.cabinTemp.toFixed(1)}°C`, 'destructive');
      }
      
      // Handbrake
      if (sensorData.handbrake && sensorData.speed > 0) {
         fireAlert('handbrake', 'Handbrake Engaged!', 'Vehicle is moving with handbrake engaged.', 'destructive');
      }
    };

    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, [sensorData]);

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
