import { useVehicleStore } from "@/store/vehicleStore";
import { VehicleApi, SensorData } from "@/services/vehicleApi";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const OPEN_COLOR = "#ef4444";
const OPEN_GLOW = "rgba(239,68,68,0.6)";
const CLOSED_BODY = "#1e2d3d";
const DOOR_CLOSED = "#243447";
const DOOR_STROKE = "#2d4a63";
const GLASS = "#0c1a26";
const WHEEL_COLOR = "#0a0f14";
const WHEEL_RIM = "#1e2d3d";
const HEADLIGHT_OFF = "#1a2535";
const HEADLIGHT_ON = "#fde68a";
const TAILLIGHT_OFF = "#3b0a0a";
const TAILLIGHT_ON = "#ef4444";

interface StatusChipProps {
  label: string;
  value: string;
  active?: boolean;
  warning?: boolean;
  position: "top" | "bottom" | "left" | "right";
}

function StatusChip({ label, value, active, warning }: StatusChipProps) {
  return (
    <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border text-center min-w-[72px]
      ${warning
        ? "bg-red-500/10 border-red-500/30 text-red-400"
        : active
        ? "bg-primary/10 border-primary/30 text-primary"
        : "bg-card/60 border-border/40 text-muted-foreground"}`}>
      <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">{label}</span>
      <span className={`text-sm font-bold leading-tight ${warning ? "text-red-400" : active ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function ForesterDiagram({ s }: { s: SensorData }) {
  const W = 320;
  const H = 560;

  const bodyLeft = 80;
  const bodyRight = 240;
  const bodyTop = 60;
  const bodyBottom = 500;
  const bodyW = bodyRight - bodyLeft;

  const bonnетY1 = bodyTop;
  const bonnetY2 = 165;
  const bootY1 = 395;
  const bootY2 = bodyBottom;

  const frontDoorTop = 182;
  const frontDoorBot = 300;
  const rearDoorTop = 300;
  const rearDoorBot = 390;

  const doorOpenDist = 52;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[260px] mx-auto drop-shadow-2xl"
      style={{ filter: "drop-shadow(0 0 32px rgba(0,70,140,0.18))" }}
    >
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1e3a5a" />
          <stop offset="100%" stopColor="#0e1e2e" />
        </radialGradient>
        <filter id="openGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="headlightGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* === HEADLIGHT GLOW === */}
      {s.headlights && (
        <>
          <ellipse cx={bodyLeft + 22} cy={bodyTop - 10} rx="28" ry="18" fill="#fde68a" opacity="0.18" filter="url(#headlightGlow)" />
          <ellipse cx={bodyRight - 22} cy={bodyTop - 10} rx="28" ry="18" fill="#fde68a" opacity="0.18" filter="url(#headlightGlow)" />
        </>
      )}

      {/* === BONNET OPEN === */}
      {s.bonnet && (
        <rect
          x={bodyLeft + 2} y={bonnетY1 - 36}
          width={bodyW - 4} height={bonnetY2 - bonnетY1 + 10}
          rx="8" fill={OPEN_COLOR} opacity="0.22" filter="url(#openGlow)"
        />
      )}

      {/* === BOOT OPEN === */}
      {s.boot && (
        <rect
          x={bodyLeft + 2} y={bootY1 - 10}
          width={bodyW - 4} height={bootY2 - bootY1 + 36}
          rx="8" fill={OPEN_COLOR} opacity="0.22" filter="url(#openGlow)"
        />
      )}

      {/* === LEFT OPEN DOORS === */}
      {s.driverDoor && (
        <rect x={bodyLeft - doorOpenDist - 2} y={frontDoorTop + 4} width={doorOpenDist} height={frontDoorBot - frontDoorTop - 8}
          rx="5" fill={OPEN_COLOR} opacity="0.85" filter="url(#openGlow)" />
      )}
      {s.rearLeftDoor && (
        <rect x={bodyLeft - doorOpenDist - 2} y={rearDoorTop + 4} width={doorOpenDist} height={rearDoorBot - rearDoorTop - 8}
          rx="5" fill={OPEN_COLOR} opacity="0.85" filter="url(#openGlow)" />
      )}

      {/* === RIGHT OPEN DOORS === */}
      {s.passengerDoor && (
        <rect x={bodyRight + 2} y={frontDoorTop + 4} width={doorOpenDist} height={frontDoorBot - frontDoorTop - 8}
          rx="5" fill={OPEN_COLOR} opacity="0.85" filter="url(#openGlow)" />
      )}
      {s.rearRightDoor && (
        <rect x={bodyRight + 2} y={rearDoorTop + 4} width={doorOpenDist} height={rearDoorBot - rearDoorTop - 8}
          rx="5" fill={OPEN_COLOR} opacity="0.85" filter="url(#openGlow)" />
      )}

      {/* === MAIN BODY === */}
      <path
        d={`
          M ${bodyLeft + 20},${bodyTop}
          Q ${W / 2},${bodyTop - 8} ${bodyRight - 20},${bodyTop}
          Q ${bodyRight + 10},${bodyTop + 20} ${bodyRight},${bodyTop + 60}
          L ${bodyRight},${bodyBottom - 60}
          Q ${bodyRight + 10},${bodyBottom - 20} ${bodyRight - 20},${bodyBottom}
          Q ${W / 2},${bodyBottom + 8} ${bodyLeft + 20},${bodyBottom}
          Q ${bodyLeft - 10},${bodyBottom - 20} ${bodyLeft},${bodyBottom - 60}
          L ${bodyLeft},${bodyTop + 60}
          Q ${bodyLeft - 10},${bodyTop + 20} ${bodyLeft + 20},${bodyTop}
          Z
        `}
        fill="url(#bodyGrad)"
        stroke={DOOR_STROKE}
        strokeWidth="2"
      />

      {/* === BONNET PANEL === */}
      <path
        d={`M ${bodyLeft + 14},${bonnетY1 + 2} Q ${W/2},${bonnетY1 - 4} ${bodyRight - 14},${bonnетY1 + 2} L ${bodyRight - 20},${bonnetY2} Q ${W/2},${bonnetY2 + 6} ${bodyLeft + 20},${bonnetY2} Z`}
        fill={s.bonnet ? OPEN_COLOR : "#162030"}
        stroke={s.bonnet ? OPEN_COLOR : DOOR_STROKE}
        strokeWidth={s.bonnet ? "2" : "1.5"}
        opacity={s.bonnet ? 0.9 : 1}
        className="transition-all duration-300"
        filter={s.bonnet ? "url(#openGlow)" : undefined}
      />

      {/* === BOOT PANEL === */}
      <path
        d={`M ${bodyLeft + 20},${bootY1} Q ${W/2},${bootY1 - 6} ${bodyRight - 20},${bootY1} L ${bodyRight - 14},${bootY2 - 2} Q ${W/2},${bootY2 + 4} ${bodyLeft + 14},${bootY2 - 2} Z`}
        fill={s.boot ? OPEN_COLOR : "#162030"}
        stroke={s.boot ? OPEN_COLOR : DOOR_STROKE}
        strokeWidth={s.boot ? "2" : "1.5"}
        opacity={s.boot ? 0.9 : 1}
        className="transition-all duration-300"
        filter={s.boot ? "url(#openGlow)" : undefined}
      />

      {/* === WINDSHIELDS === */}
      <path
        d={`M ${bodyLeft + 18},${bonnetY2 + 4} Q ${W/2},${bonnetY2 - 4} ${bodyRight - 18},${bonnetY2 + 4} L ${bodyRight - 22},${bonnetY2 + 52} Q ${W/2},${bonnetY2 + 60} ${bodyLeft + 22},${bonnetY2 + 52} Z`}
        fill={GLASS} stroke="#1a3a52" strokeWidth="1.5" opacity="0.9"
      />
      <path
        d={`M ${bodyLeft + 22},${bootY1 - 52} Q ${W/2},${bootY1 - 60} ${bodyRight - 22},${bootY1 - 52} L ${bodyRight - 18},${bootY1 - 4} Q ${W/2},${bootY1 + 4} ${bodyLeft + 18},${bootY1 - 4} Z`}
        fill={GLASS} stroke="#1a3a52" strokeWidth="1.5" opacity="0.9"
      />

      {/* === DOOR DIVIDERS === */}
      {/* Front/Rear door seam */}
      <line x1={bodyLeft + 2} y1={frontDoorBot} x2={bodyRight - 2} y2={frontDoorBot} stroke={DOOR_STROKE} strokeWidth="1.5" opacity="0.7" />
      {/* Left side seam (front door) */}
      <line x1={bodyLeft} y1={frontDoorTop} x2={bodyLeft} y2={rearDoorBot} stroke={s.driverDoor || s.rearLeftDoor ? OPEN_COLOR : DOOR_STROKE} strokeWidth={s.driverDoor || s.rearLeftDoor ? "3" : "2"} className="transition-all duration-300" />
      {/* Right side seam */}
      <line x1={bodyRight} y1={frontDoorTop} x2={bodyRight} y2={rearDoorBot} stroke={s.passengerDoor || s.rearRightDoor ? OPEN_COLOR : DOOR_STROKE} strokeWidth={s.passengerDoor || s.rearRightDoor ? "3" : "2"} className="transition-all duration-300" />

      {/* Door handle hints */}
      <rect x={bodyLeft + 6} y={frontDoorTop + (frontDoorBot - frontDoorTop) / 2 - 4} width="14" height="4" rx="2"
        fill={s.driverDoor ? OPEN_COLOR : "#2a4a68"} className="transition-colors duration-300" />
      <rect x={bodyRight - 20} y={frontDoorTop + (frontDoorBot - frontDoorTop) / 2 - 4} width="14" height="4" rx="2"
        fill={s.passengerDoor ? OPEN_COLOR : "#2a4a68"} className="transition-colors duration-300" />
      <rect x={bodyLeft + 6} y={rearDoorTop + (rearDoorBot - rearDoorTop) / 2 - 4} width="14" height="4" rx="2"
        fill={s.rearLeftDoor ? OPEN_COLOR : "#2a4a68"} className="transition-colors duration-300" />
      <rect x={bodyRight - 20} y={rearDoorTop + (rearDoorBot - rearDoorTop) / 2 - 4} width="14" height="4" rx="2"
        fill={s.rearRightDoor ? OPEN_COLOR : "#2a4a68"} className="transition-colors duration-300" />

      {/* Door open glow strips on body edges */}
      {s.driverDoor && <rect x={bodyLeft - 1} y={frontDoorTop + 2} width="5" height={frontDoorBot - frontDoorTop - 4} rx="3" fill={OPEN_COLOR} filter="url(#openGlow)" />}
      {s.passengerDoor && <rect x={bodyRight - 4} y={frontDoorTop + 2} width="5" height={frontDoorBot - frontDoorTop - 4} rx="3" fill={OPEN_COLOR} filter="url(#openGlow)" />}
      {s.rearLeftDoor && <rect x={bodyLeft - 1} y={rearDoorTop + 2} width="5" height={rearDoorBot - rearDoorTop - 4} rx="3" fill={OPEN_COLOR} filter="url(#openGlow)" />}
      {s.rearRightDoor && <rect x={bodyRight - 4} y={rearDoorTop + 2} width="5" height={rearDoorBot - rearDoorTop - 4} rx="3" fill={OPEN_COLOR} filter="url(#openGlow)" />}

      {/* Roof panel */}
      <rect x={bodyLeft + 24} y={bonnetY2 + 58} width={bodyW - 48} height={bootY1 - bonnetY2 - 116}
        rx="10" fill="#0d1a26" stroke="#1a3a52" strokeWidth="1" />

      {/* Interior light glow */}
      {s.interiorLights && (
        <rect x={bodyLeft + 28} y={bonnetY2 + 62} width={bodyW - 56} height={bootY1 - bonnetY2 - 124}
          rx="8" fill="#ffffff" opacity="0.08" filter="url(#headlightGlow)" />
      )}

      {/* === HEADLIGHTS === */}
      <path
        d={`M ${bodyLeft + 10},${bodyTop + 6} L ${bodyLeft + 36},${bodyTop + 4} L ${bodyLeft + 38},${bodyTop + 18} L ${bodyLeft + 10},${bodyTop + 20} Z`}
        fill={s.headlights ? HEADLIGHT_ON : HEADLIGHT_OFF}
        stroke={s.headlights ? "#fde68a" : "#1a3a52"}
        strokeWidth="1"
        className="transition-all duration-300"
        filter={s.headlights ? "url(#headlightGlow)" : undefined}
      />
      <path
        d={`M ${bodyRight - 10},${bodyTop + 6} L ${bodyRight - 36},${bodyTop + 4} L ${bodyRight - 38},${bodyTop + 18} L ${bodyRight - 10},${bodyTop + 20} Z`}
        fill={s.headlights ? HEADLIGHT_ON : HEADLIGHT_OFF}
        stroke={s.headlights ? "#fde68a" : "#1a3a52"}
        strokeWidth="1"
        className="transition-all duration-300"
        filter={s.headlights ? "url(#headlightGlow)" : undefined}
      />

      {/* Parking lights (smaller, amber) */}
      <rect x={bodyLeft + 38} y={bodyTop + 6} width="18" height="14" rx="2"
        fill={s.parkingLights ? "#f59e0b" : HEADLIGHT_OFF}
        className="transition-all duration-300"
        filter={s.parkingLights ? "url(#openGlow)" : undefined}
      />
      <rect x={bodyRight - 56} y={bodyTop + 6} width="18" height="14" rx="2"
        fill={s.parkingLights ? "#f59e0b" : HEADLIGHT_OFF}
        className="transition-all duration-300"
        filter={s.parkingLights ? "url(#openGlow)" : undefined}
      />

      {/* === TAILLIGHTS === */}
      <path
        d={`M ${bodyLeft + 10},${bodyBottom - 6} L ${bodyLeft + 44},${bodyBottom - 4} L ${bodyLeft + 44},${bodyBottom - 22} L ${bodyLeft + 10},${bodyBottom - 24} Z`}
        fill={s.parkingLights || s.reverseLight ? TAILLIGHT_ON : TAILLIGHT_OFF}
        stroke={s.parkingLights ? "#ef4444" : "#3b0a0a"}
        strokeWidth="1"
        className="transition-all duration-300"
        filter={s.parkingLights ? "url(#openGlow)" : undefined}
      />
      <path
        d={`M ${bodyRight - 10},${bodyBottom - 6} L ${bodyRight - 44},${bodyBottom - 4} L ${bodyRight - 44},${bodyBottom - 22} L ${bodyRight - 10},${bodyBottom - 24} Z`}
        fill={s.parkingLights || s.reverseLight ? TAILLIGHT_ON : TAILLIGHT_OFF}
        stroke={s.parkingLights ? "#ef4444" : "#3b0a0a"}
        strokeWidth="1"
        className="transition-all duration-300"
        filter={s.parkingLights ? "url(#openGlow)" : undefined}
      />

      {/* Reverse lights */}
      {s.reverseLight && (
        <>
          <rect x={bodyLeft + 44} y={bodyBottom - 22} width="22" height="18" rx="2" fill="#f8fafc" opacity="0.9" filter="url(#headlightGlow)" />
          <rect x={bodyRight - 66} y={bodyBottom - 22} width="22" height="18" rx="2" fill="#f8fafc" opacity="0.9" filter="url(#headlightGlow)" />
        </>
      )}

      {/* === WHEELS === */}
      {([
        [bodyLeft - 20, bodyTop + 64],
        [bodyRight + 5, bodyTop + 64],
        [bodyLeft - 20, bodyBottom - 104],
        [bodyRight + 5, bodyBottom - 104],
      ] as [number, number][]).map(([wx, wy], i) => (
        <g key={i}>
          <rect x={wx} y={wy} width="15" height="40" rx="5" fill={WHEEL_COLOR} stroke="#0d1824" strokeWidth="1.5" />
          <rect x={wx + 2} y={wy + 4} width="11" height="32" rx="3" fill={WHEEL_RIM} stroke="#1a2d3d" strokeWidth="1" />
          <line x1={wx + 7.5} y1={wy + 6} x2={wx + 7.5} y2={wy + 34} stroke="#1e3a52" strokeWidth="1" />
          <line x1={wx + 2} y1={wy + 20} x2={wx + 13} y2={wy + 20} stroke="#1e3a52" strokeWidth="1" />
        </g>
      ))}

      {/* === OPEN DOOR LABELS === */}
      {s.driverDoor && (
        <text x={bodyLeft - doorOpenDist / 2 - 2} y={frontDoorTop + (frontDoorBot - frontDoorTop) / 2 + 4}
          textAnchor="middle" fill="white" fontSize="9" fontWeight="700" letterSpacing="0.5">OPEN</text>
      )}
      {s.passengerDoor && (
        <text x={bodyRight + doorOpenDist / 2 + 2} y={frontDoorTop + (frontDoorBot - frontDoorTop) / 2 + 4}
          textAnchor="middle" fill="white" fontSize="9" fontWeight="700" letterSpacing="0.5">OPEN</text>
      )}
      {s.rearLeftDoor && (
        <text x={bodyLeft - doorOpenDist / 2 - 2} y={rearDoorTop + (rearDoorBot - rearDoorTop) / 2 + 4}
          textAnchor="middle" fill="white" fontSize="9" fontWeight="700" letterSpacing="0.5">OPEN</text>
      )}
      {s.rearRightDoor && (
        <text x={bodyRight + doorOpenDist / 2 + 2} y={rearDoorTop + (rearDoorBot - rearDoorTop) / 2 + 4}
          textAnchor="middle" fill="white" fontSize="9" fontWeight="700" letterSpacing="0.5">OPEN</text>
      )}
      {s.bonnet && (
        <text x={W / 2} y={bonnетY1 - 14} textAnchor="middle" fill={OPEN_COLOR} fontSize="10" fontWeight="700" letterSpacing="0.5">BONNET OPEN</text>
      )}
      {s.boot && (
        <text x={W / 2} y={bootY2 + 22} textAnchor="middle" fill={OPEN_COLOR} fontSize="10" fontWeight="700" letterSpacing="0.5">BOOT OPEN</text>
      )}

      {/* Subaru badge center */}
      <circle cx={W / 2} cy={(bonnetY2 + bootY1) / 2} r="8" fill="#0d1824" stroke="#1a3a52" strokeWidth="1.5" />
      <circle cx={W / 2} cy={(bonnetY2 + bootY1) / 2} r="5" fill="none" stroke="#2a5080" strokeWidth="1.5" />
    </svg>
  );
}

export default function Vehicle() {
  const sensorData = useVehicleStore((s) => s.sensorData);
  const [showToggles, setShowToggles] = useState(false);

  const toggleSensor = (key: keyof typeof sensorData) => {
    VehicleApi.updateData({ [key]: !sensorData[key as keyof typeof sensorData] });
  };

  const anyDoorOpen = sensorData.driverDoor || sensorData.passengerDoor || sensorData.rearLeftDoor || sensorData.rearRightDoor;

  const battV = sensorData.batteryVoltage;
  const battColor = battV >= 12.5 ? "text-green-400" : battV >= 12.0 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-[calc(100dvh-6rem)] flex flex-col pb-2">

      {/* Top status bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle</h1>
          <p className="text-sm text-muted-foreground">2010 Subaru Forester XS</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border
          ${sensorData.engineRunning
            ? "bg-green-500/10 border-green-500/40 text-green-400"
            : "bg-muted/40 border-border/40 text-muted-foreground"}`}>
          <span className={`w-2 h-2 rounded-full ${sensorData.engineRunning ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
          {sensorData.engineRunning ? "ENGINE ON" : "ENGINE OFF"}
        </div>
      </div>

      {/* Main layout: chips + car + chips */}
      <div className="flex-1 flex flex-col items-center px-2 gap-2">

        {/* Top chips row */}
        <div className="flex gap-2 justify-center flex-wrap">
          <StatusChip label="Speed" value={`${sensorData.speed} km/h`} position="top" active={sensorData.speed > 0} />
          <StatusChip label="Fuel" value={`${Math.round(sensorData.fuelLevel)}%`} position="top"
            warning={sensorData.fuelLevel < 20} active={sensorData.fuelLevel >= 20} />
          <StatusChip label="RPM" value={sensorData.engineRunning ? `${sensorData.rpm}` : "—"} position="top" active={sensorData.engineRunning} />
          <StatusChip label="Handbrake" value={sensorData.handbrake ? "ON" : "OFF"} position="top"
            warning={!sensorData.handbrake && sensorData.speed === 0} active={sensorData.handbrake} />
        </div>

        {/* Car + side chips */}
        <div className="flex items-center justify-center gap-3 w-full max-w-2xl">

          {/* Left chips */}
          <div className="flex flex-col gap-2 shrink-0">
            <StatusChip label="Driver" value={sensorData.driverDoor ? "OPEN" : "Closed"} position="left" warning={sensorData.driverDoor} />
            <StatusChip label="Rear L" value={sensorData.rearLeftDoor ? "OPEN" : "Closed"} position="left" warning={sensorData.rearLeftDoor} />
          </div>

          {/* Car diagram */}
          <div className="flex-1 max-w-[280px] relative">
            <AnimatePresence>
              {anyDoorOpen && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.06) 0%, transparent 70%)" }}
                />
              )}
            </AnimatePresence>
            <ForesterDiagram s={sensorData as any} />
          </div>

          {/* Right chips */}
          <div className="flex flex-col gap-2 shrink-0">
            <StatusChip label="Passenger" value={sensorData.passengerDoor ? "OPEN" : "Closed"} position="right" warning={sensorData.passengerDoor} />
            <StatusChip label="Rear R" value={sensorData.rearRightDoor ? "OPEN" : "Closed"} position="right" warning={sensorData.rearRightDoor} />
          </div>
        </div>

        {/* Bottom chips row */}
        <div className="flex gap-2 justify-center flex-wrap">
          <StatusChip label="Battery" value={`${battV.toFixed(1)}V`} position="bottom"
            warning={battV < 12.0} active={battV >= 12.5} />
          <StatusChip label="Cabin" value={`${sensorData.cabinTemp.toFixed(0)}°C`} position="bottom"
            warning={sensorData.cabinTemp > 38} active={sensorData.cabinTemp <= 28} />
          <StatusChip label="Outside" value={`${sensorData.outsideTemp.toFixed(0)}°C`} position="bottom" />
          <StatusChip label="Bonnet" value={sensorData.bonnet ? "OPEN" : "Closed"} position="bottom" warning={sensorData.bonnet} />
          <StatusChip label="Boot" value={sensorData.boot ? "OPEN" : "Closed"} position="bottom" warning={sensorData.boot} />
        </div>

        {/* Lights row */}
        <div className="flex gap-2 justify-center flex-wrap">
          <StatusChip label="Headlights" value={sensorData.headlights ? "ON" : "Off"} position="bottom"
            active={sensorData.headlights} warning={false} />
          <StatusChip label="Parking" value={sensorData.parkingLights ? "ON" : "Off"} position="bottom"
            active={sensorData.parkingLights} />
          <StatusChip label="Interior" value={sensorData.interiorLights ? "ON" : "Off"} position="bottom"
            active={sensorData.interiorLights} />
          <StatusChip label="Reverse" value={sensorData.reverseLight ? "ON" : "Off"} position="bottom"
            active={sensorData.reverseLight} />
        </div>

        {/* Simulation toggles collapsible */}
        <div className="w-full max-w-2xl mt-1">
          <button
            data-testid="button-toggle-simulation"
            onClick={() => setShowToggles(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card/40 border border-border/40 text-sm font-semibold text-muted-foreground hover:bg-card/60 transition-colors"
          >
            <span className="uppercase tracking-wider text-xs">Simulation Toggles</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showToggles ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showToggles && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-4 rounded-xl bg-card/30 border border-border/30 grid grid-cols-2 gap-4">
                  {([
                    ["engineRunning", "Engine Running"],
                    ["handbrake", "Handbrake"],
                    ["driverDoor", "Driver Door"],
                    ["passengerDoor", "Passenger Door"],
                    ["rearLeftDoor", "Rear Left Door"],
                    ["rearRightDoor", "Rear Right Door"],
                    ["bonnet", "Bonnet"],
                    ["boot", "Boot"],
                    ["headlights", "Headlights"],
                    ["parkingLights", "Parking Lights"],
                    ["interiorLights", "Interior Lights"],
                    ["reverseLight", "Reverse Light"],
                  ] as [keyof typeof sensorData, string][]).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer" htmlFor={key}>{label}</Label>
                      <Switch
                        id={key}
                        data-testid={`toggle-${key}`}
                        checked={!!sensorData[key]}
                        onCheckedChange={() => toggleSensor(key)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
