export function humanizeError(error: unknown, fallback = 'Algo no salió bien. Probá de nuevo en unos segundos.') {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const message = raw.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'El correo o la contraseña no coinciden. Revisá los datos e intentá otra vez.';
  }
  if (message.includes('email not confirmed')) {
    return 'Todavía falta confirmar este correo antes de entrar.';
  }
  if (message.includes('already registered') || message.includes('already exists') || message.includes('duplicate') || message.includes('ya existe')) {
    return 'Ya existe un registro con esos datos. Revisá la información antes de continuar.';
  }
  if (message.includes('permission denied') || message.includes('row-level security') || message.includes('violates row-level security')) {
    return 'No tenés permisos para hacer esta acción con tu usuario actual.';
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch')) {
    return 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  if (message.includes('supabase no está configurado')) {
    return 'La conexión con la base de datos todavía no está configurada.';
  }
  if (message.includes('jwt') || message.includes('token') || message.includes('session')) {
    return 'Tu sesión venció. Cerrá sesión e ingresá nuevamente.';
  }
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'No se pudo guardar porque falta o no coincide un dato relacionado.';
  }

  return raw && !looksTechnical(raw) ? raw : fallback;
}

function looksTechnical(message: string) {
  return /[{}()[\];]|[a-z_]+_[a-z_]+|^[A-Z0-9_]+$/i.test(message) || message.length > 140;
}
