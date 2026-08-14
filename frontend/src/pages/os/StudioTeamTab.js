import React, { useEffect, useState } from "react";
import { Plus, Loader2, X, Mail, Trash2 } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const ROLE_LABEL = { owner: "Inhaber", admin: "Admin", artist: "Artist", staff: "Mitarbeiter" };
// Ranked the same way the backend's ROLE_RANK is (plugins/auth.ts) — used
// only to decide what this screen shows, the backend re-checks everything
// it actually enforces.
const ROLE_RANK = { staff: 1, artist: 2, admin: 3, owner: 4 };

function RoleBadge({ role }) {
  return (
    <span className="text-[10px] font-inter uppercase tracking-wide px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 flex-shrink-0">
      {ROLE_LABEL[role] || role}
    </span>
  );
}

function InviteForm({ canAssignAdmin, onSave, onCancel, saving, error }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const roleOptions = canAssignAdmin ? ["staff", "artist", "admin"] : ["staff", "artist"];

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5 mb-4">
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" className="rounded-xl h-10" autoFocus />
        </div>
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Name (optional)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wie soll die Person heißen?" className="rounded-xl h-10" />
        </div>
      </div>

      <div className="mb-4">
        <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Rolle</Label>
        <div className="flex gap-2">
          {roleOptions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-3 h-9 rounded-lg text-xs font-inter transition-colors ${
                role === r ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs font-inter text-red-600 mb-3">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-inter">
          Abbrechen
        </Button>
        <Button
          type="button"
          disabled={saving || !email.trim()}
          onClick={() => onSave({ email: email.trim(), name: name.trim() || undefined, role })}
          className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : "Einladung senden"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Team roster + pending invites + the invite form. Everyone with dashboard
 * access can see who's on the team; inviting, changing roles, and removing
 * someone needs admin — the buttons for those simply aren't rendered below
 * that, mirroring what the backend would reject anyway (requireRole in
 * team.ts).
 */
export default function StudioTeamTab({ staff }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = ROLE_RANK[staff?.role] >= ROLE_RANK.admin;
  const isOwner = staff?.role === "owner";

  useEffect(() => {
    studioApi
      .get("/studios/me/team")
      .then(({ data }) => {
        setMembers(data.members || []);
        setInvites(data.invites || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function sendInvite(fields) {
    setSaving(true);
    setFormError("");
    try {
      const { data } = await studioApi.post("/studios/me/team/invites", fields);
      setInvites((prev) => [...prev, data]);
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Einladung konnte nicht gesendet werden.");
    } finally {
      setSaving(false);
    }
  }

  async function revokeInvite(id) {
    await studioApi.delete(`/studios/me/team/invites/${id}`);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  async function changeRole(id, role) {
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, role } : m)));
    try {
      await studioApi.patch(`/studios/me/team/${id}`, { role });
    } catch (err) {
      setMembers(prev); // roll back — the backend has the real rules (e.g. only the owner may grant admin)
    }
  }

  async function removeMember(id) {
    await studioApi.delete(`/studios/me/team/${id}`);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-zinc-300" size={22} />
      </div>
    );
  }

  return (
    <div>
      {isAdmin && showForm && (
        <InviteForm canAssignAdmin={isOwner} onSave={sendInvite} onCancel={() => setShowForm(false)} saving={saving} error={formError} />
      )}

      {isAdmin && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-zinc-300 text-sm font-inter text-zinc-500 hover:border-zinc-400 transition-colors mb-4"
        >
          <Plus size={15} /> Teammitglied einladen
        </button>
      )}

      {invites.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-500 mb-2 px-1">Offene Einladungen</div>
          <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] divide-y divide-zinc-100">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail size={14} className="text-zinc-300 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-inter text-sm text-zinc-900 truncate">{i.email}</div>
                    <div className="text-xs font-inter text-zinc-400">Wartet auf Bestätigung</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RoleBadge role={i.role} />
                  {isAdmin && (
                    <button type="button" onClick={() => revokeInvite(i.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Widerrufen">
                      <X size={14} className="text-zinc-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-500 mb-2 px-1">Team</div>
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] divide-y divide-zinc-100">
        {members.map((m) => {
          const canManage = isAdmin && m.id !== staff.id && m.role !== "owner";
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="font-inter font-medium text-sm text-zinc-900 truncate">
                  {m.name}
                  {m.id === staff.id && <span className="text-zinc-400 font-normal"> (du)</span>}
                </div>
                <div className="text-xs font-inter text-zinc-500 truncate">{m.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canManage ? (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    className="text-xs font-inter text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg h-8 px-2"
                  >
                    <option value="staff">Mitarbeiter</option>
                    <option value="artist">Artist</option>
                    {isOwner && <option value="admin">Admin</option>}
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {canManage && (
                  <button type="button" onClick={() => removeMember(m.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Entfernen">
                    <Trash2 size={14} className="text-zinc-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
