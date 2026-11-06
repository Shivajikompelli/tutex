import { NextRequest } from 'next/server';
import { verifyAdminPassword } from './admin-service';

export function isAuthorizedAdmin(req: NextRequest): boolean {
  // Check cookie
  const cookieSession = req.cookies.get('admin_session')?.value;
  if (cookieSession === 'authenticated') {
    return true;
  }

  // Check header
  const headerPassword = req.headers.get('x-admin-password');
  if (headerPassword && verifyAdminPassword(headerPassword)) {
    return true;
  }

  return false;
}

