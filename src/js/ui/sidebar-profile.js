import { formatNameTitleCase } from "../utils/formatters.js";

const DEFAULT_PROFILE = {
  avatar: "RC",
  name: "Recurso Confitec",
  role: "Usuário",
  company: "JMCONFITEC SISTEMAS",
};

function $els() {
  return {
    avatar: document.querySelector(".avatar"),
    name: document.querySelector(".profile-name"),
    role: document.querySelector(".profile-role"),
    company: document.querySelector(".profile-company"),
  };
}

export function updateSidebarProfile(parsedData) {
  if (!parsedData) return resetSidebarProfile();

  const els = $els();

  if (parsedData.funcionario) {
    els.name.innerText = formatNameTitleCase(parsedData.funcionario);
    const parts = parsedData.funcionario.split(/\s+/).filter((p) => p.length > 2);
    if (parts.length >= 2) {
      els.avatar.innerText = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
      els.avatar.innerText = parts[0].substring(0, 2).toUpperCase();
    }
  }

  if (parsedData.cargo) els.role.innerText = formatNameTitleCase(parsedData.cargo);
  if (parsedData.empresa) els.company.innerText = parsedData.empresa.toUpperCase();
}

export function resetSidebarProfile() {
  const els = $els();
  els.avatar.innerText = DEFAULT_PROFILE.avatar;
  els.name.innerText = DEFAULT_PROFILE.name;
  els.role.innerText = DEFAULT_PROFILE.role;
  els.company.innerText = DEFAULT_PROFILE.company;
}
