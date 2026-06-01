import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Home, Bus, Calendar, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = user
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/routes', label: 'Routes', icon: Bus },
        { to: '/bookings', label: 'My Bookings', icon: Calendar },
        ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
      ]
    : [
        { to: '/', label: 'Home', icon: Home },
        { to: '/routes', label: 'Routes', icon: Bus },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-navy-900/95 backdrop-blur-md border-b border-navy-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="no-underline">
              <Logo dark />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gold-500/10 text-gold-400'
                        : 'text-navy-200 hover:text-white hover:bg-navy-700/50'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : ''}`} />
                    {link.label}
                  </Link>
                );
              })}

              {user ? (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-navy-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-navy-200 font-medium hidden lg:block">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-navy-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-navy-700/50"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-navy-600">
                  <Link to="/login" className="btn-ghost text-navy-200 hover:text-white !px-3">
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs
                              bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700
                              transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-navy-200 hover:text-white hover:bg-navy-700/50 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-navy-700/50 bg-navy-900 px-4 pb-4 animate-slide-down">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 py-2.5 text-sm font-medium ${
                  location.pathname === link.to ? 'text-gold-400' : 'text-navy-200'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-navy-700/50 mt-2 pt-2">
              {user ? (
                <button onClick={logout} className="flex items-center gap-2 py-2.5 text-sm text-red-400 w-full">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium text-navy-200 hover:text-white hover:bg-navy-700/50 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 text-white hover:bg-gold-600 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Logo dark className="mb-3" />
              <p className="text-navy-300 text-sm leading-relaxed max-w-xs">
                Premium scheduled shuttle service connecting your daily commute with comfort and reliability.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/" className="block text-navy-300 text-sm hover:text-gold-400 transition-colors">Home</Link>
                <Link to="/routes" className="block text-navy-300 text-sm hover:text-gold-400 transition-colors">Routes</Link>
                <Link to="/bookings" className="block text-navy-300 text-sm hover:text-gold-400 transition-colors">My Bookings</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
              <div className="space-y-2 text-navy-300 text-sm">
                <p>support@hiwayshuttle.com</p>
                <p>1-800-HI-WAY</p>
                <p className="text-navy-400 text-xs">Available 6 AM – 10 PM EST</p>
              </div>
            </div>
          </div>
          <div className="border-t border-navy-800 mt-8 pt-6 text-center text-navy-400 text-xs">
            &copy; {new Date().getFullYear()} Hi-Way-Shuttle. All rights reserved. Premium scheduled shuttle service.
          </div>
        </div>
      </footer>
    </div>
  );
}
