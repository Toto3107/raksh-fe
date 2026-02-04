import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGeolocation } from "../hooks/useGeolocation";

const API_BASE = "http://localhost:8000";

type BorewellApiResponse = {
  id: number;
  latitude: number;
  longitude: number;
  predicted_feasible: boolean | null;
  predicted_depth_m: number | null;
  model_version: string | null;
  actual_feasible?: boolean | null;
  actual_depth_m?: number | null;
};

type Purpose = "irrigation" | "drinking" | "domestic" | "industrial" | "other";
type Outcome = "success" | "low_yield" | "failed";

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: "1.5rem",
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  boxShadow: "0 18px 35px rgba(15, 23, 42, 0.6)",
  color: "#e5e7eb",
  backdropFilter: "blur(10px)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
  color: "#9ca3af",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.6rem",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.9rem",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const buttonPrimary: React.CSSProperties = {
  padding: "0.55rem 1.1rem",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #22d3ee)",
  color: "#020617",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};

const buttonSecondary: React.CSSProperties = {
  ...buttonPrimary,
  background: "transparent",
  border: "1px solid #64748b",
  color: "#e5e7eb",
};

const FinalRegisterBorewell: React.FC = () => {
  const geo = useGeolocation();

  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [ownerName, setOwnerName] = useState<string>("");
  const [village, setVillage] = useState<string>("");
  const [block, setBlock] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [purpose, setPurpose] = useState<Purpose>("irrigation");
  const [landParcelId, setLandParcelId] = useState<string>("");

  const [hasBeenDrilled, setHasBeenDrilled] = useState<boolean>(false);
  const [actualDepth, setActualDepth] = useState<string>("");
  const [actualOutcome, setActualOutcome] = useState<Outcome>("success");

  const [submitting, setSubmitting] = useState(false);
  const [apiResult, setApiResult] = useState<BorewellApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update lat/lon from device once available, but allow edits
  useEffect(() => {
    if (geo.latitude !== null && geo.longitude !== null) {
      // Only set if user hasn't typed anything yet
      setLatitude((prev) => (prev === "" ? geo.latitude!.toFixed(6) : prev));
      setLongitude((prev) => (prev === "" ? geo.longitude!.toFixed(6) : prev));
    }
  }, [geo.latitude, geo.longitude]);

  const handleUseDeviceLocation = () => {
    if (geo.latitude !== null && geo.longitude !== null) {
      setLatitude(geo.latitude.toFixed(6));
      setLongitude(geo.longitude.toFixed(6));
      setError(null);
    } else if (geo.error) {
      setError(geo.error);
    } else {
      setError("Trying to detect device location. Please allow location access.");
    }
  };

  const validate = (): boolean => {
    setError(null);

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError("Latitude and longitude must be valid numbers.");
      return false;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Latitude must be between -90 and 90, longitude between -180 and 180.");
      return false;
    }
    if (!ownerName.trim()) {
      setError("Owner name is required.");
      return false;
    }
    if (!village.trim()) {
      setError("Village is required.");
      return false;
    }
    if (!block.trim()) {
      setError("Block is required.");
      return false;
    }
    if (!district.trim()) {
      setError("District is required.");
      return false;
    }

    if (hasBeenDrilled) {
      const depth = parseFloat(actualDepth);
      if (Number.isNaN(depth) || depth <= 0) {
        setError("Please enter a valid actual depth (m) for drilled borewells.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiResult(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      // For now, backend only expects lat/lon.
      // We attach extra fields so future backend versions can consume them.
      const payload = {
        latitude: lat,
        longitude: lon,
        owner_name: ownerName.trim(),
        village: village.trim(),
        block: block.trim(),
        district: district.trim(),
        purpose,
        land_parcel_id: landParcelId.trim() || null,
        has_been_drilled: hasBeenDrilled,
        actual_depth_m: hasBeenDrilled ? parseFloat(actualDepth) : null,
        actual_outcome: hasBeenDrilled ? actualOutcome : null,
      };

      const res = await axios.post<BorewellApiResponse>(`${API_BASE}/borewells/`, payload);
      setApiResult(res.data);
      setError(null);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 4 }}>Register Existing Borewell</h2>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Capture real borewell data to improve RaKsh model accuracy over time.
          </p>
        </div>
        <div
          style={{
            padding: "0.25rem 0.7rem",
            borderRadius: 999,
            border: "1px solid #334155",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#a5b4fc",
          }}
        >
          data capture
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {/* Location section */}
        <div style={{ gridColumn: "1 / -1" }}>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 8 }}>
            Location (latitude, longitude)
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                style={inputStyle}
                placeholder="e.g. 22.720000"
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                style={inputStyle}
                placeholder="e.g. 75.860000"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
              <label style={labelStyle}>Device location</label>
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                style={buttonSecondary}
                disabled={geo.loading}
              >
                {geo.loading ? "Detecting..." : "Use my current location"}
              </button>
              {geo.accuracy && (
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                  Accuracy ~ {Math.round(geo.accuracy)} m
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Owner & address */}
        <div>
          <label style={labelStyle}>Owner name</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            style={inputStyle}
            placeholder="Farmer / Institution name"
          />
        </div>
        <div>
          <label style={labelStyle}>Village</label>
          <input
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            style={inputStyle}
            placeholder="Village name"
          />
        </div>
        <div>
          <label style={labelStyle}>Block / Tehsil</label>
          <input
            type="text"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            style={inputStyle}
            placeholder="Block / Tehsil"
          />
        </div>
        <div>
          <label style={labelStyle}>District</label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={inputStyle}
            placeholder="District"
          />
        </div>

        {/* Purpose & parcel */}
        <div>
          <label style={labelStyle}>Primary purpose</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as Purpose)}
            style={selectStyle}
          >
            <option value="irrigation">Irrigation</option>
            <option value="drinking">Drinking water</option>
            <option value="domestic">Domestic / household</option>
            <option value="industrial">Industrial / commercial</option>
            <option value="other">Other / mixed</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Land parcel ID (optional)</label>
          <input
            type="text"
            value={landParcelId}
            onChange={(e) => setLandParcelId(e.target.value)}
            style={inputStyle}
            placeholder="Khasra / survey no. if available"
          />
        </div>

        {/* Drilling status */}
        <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
          <div style={checkboxRowStyle}>
            <input
              id="has_drilled"
              type="checkbox"
              checked={hasBeenDrilled}
              onChange={(e) => setHasBeenDrilled(e.target.checked)}
            />
            <label htmlFor="has_drilled" style={{ fontSize: "0.85rem" }}>
              This borewell has already been drilled (ground truth available)
            </label>
          </div>
        </div>

        {hasBeenDrilled && (
          <>
            <div>
              <label style={labelStyle}>Actual drilled depth (m)</label>
              <input
                type="number"
                step="0.1"
                value={actualDepth}
                onChange={(e) => setActualDepth(e.target.value)}
                style={inputStyle}
                placeholder="e.g. 120"
              />
            </div>
            <div>
              <label style={labelStyle}>Outcome</label>
              <select
                value={actualOutcome}
                onChange={(e) => setActualOutcome(e.target.value as Outcome)}
                style={selectStyle}
              >
                <option value="success">Successful (good yield)</option>
                <option value="low_yield">Low yield / marginal</option>
                <option value="failed">Failed / dry</option>
              </select>
            </div>
          </>
        )}

        {/* Submission & messages */}
        <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button type="submit" style={buttonPrimary} disabled={submitting}>
              {submitting ? "Saving record..." : "Save borewell record"}
            </button>
            {error && (
              <span style={{ fontSize: "0.85rem", color: "#fca5a5" }}>{error}</span>
            )}
          </div>

          {apiResult && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "rgba(15, 23, 42, 0.7)",
                fontSize: "0.85rem",
              }}
            >
              <p style={{ marginBottom: 4 }}>
                Saved borewell ID: <strong>#{apiResult.id}</strong>
              </p>
              <p style={{ marginBottom: 4 }}>
                Location:{" "}
                <strong>
                  {apiResult.latitude.toFixed(6)}, {apiResult.longitude.toFixed(6)}
                </strong>
              </p>
              <p style={{ marginBottom: 4 }}>
                Model snapshot at registration:{" "}
                <strong>{apiResult.model_version || "N/A"}</strong>
              </p>
              <p style={{ color: "#9ca3af" }}>
                Note: current backend stores only lat/long + model prediction;
                additional fields are for future versions and dataset design.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default FinalRegisterBorewell;
