import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function getSessionUser(req = null) {
  try {
    let token;

    if (req?.cookies?.get) {
    
      token = req.cookies.get('token')?.value;
    } else if (typeof window === 'undefined') {
      
      const cookieStore = cookies(); 
      token = cookieStore.get('token')?.value;
    }

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (err) {
    console.error('getSessionUser error:', err);
    return null;
  }
}
