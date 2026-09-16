import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Users, CheckCircle, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUserStatus } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.user);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        'http://localhost:5000/api/users/users',
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
          },
        }
      );

      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Erreur lors de la récupération des utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [userInfo?.token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (id) => {
    try {
      setApproving(id);

      await axios.put(
        `http://localhost:5000/api/users/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
          },
        }
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === id ? { ...u, isApproved: true } : u
        )
      );

      if (userInfo && id === userInfo.id) {
        dispatch(updateUserStatus({ id, isApproved: true }));
      }

      await fetchUsers();
    } catch (err) {
      alert("Erreur lors de l'approbation de l'utilisateur.");
    } finally {
      setApproving(null);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* En-tête du panneau admin */}
        <div className="flex justify-between items-center border-b border-[#9E6B6B]/30 pb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
              Administration
            </span>

            <h1 className="text-3xl font-serif font-light">
              Tableau de bord Admin
            </h1>
          </div>

          <div className="flex items-center gap-4">

            {/* Bouton Rafraîchir */}
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              Rafraîchir
            </button>

            {/* Bouton Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Déconnexion
            </button>

          </div>
        </div>

        {/* Statistiques rapides */}
        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-4 rounded-none">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                Total Utilisateurs
              </p>

              <p className="text-3xl font-serif text-[#9E6B6B]">
                {users.length}
              </p>
            </div>

            <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-4 rounded-none">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                En attente
              </p>

              <p className="text-3xl font-serif text-amber-700">
                {
                  users.filter(
                    (u) => !u.isApproved && u.role !== 'admin'
                  ).length
                }
              </p>
            </div>

            <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-4 rounded-none">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                Approuvés
              </p>

              <p className="text-3xl font-serif text-green-700">
                {
                  users.filter(
                    (u) => u.isApproved || u.role === 'admin'
                  ).length
                }
              </p>
            </div>

          </div>
        )}

        {/* Contenu */}
        {loading ? (
          <p className="text-center text-neutral-400 font-mono text-xs">
            Chargement des utilisateurs...
          </p>
        ) : error ? (
          <p className="text-center text-red-400 font-mono text-xs">
            {error}
          </p>
        ) : users.length === 0 ? (
          <p className="text-center text-neutral-400 font-mono text-xs">
            Aucun utilisateur inscrit.
          </p>
        ) : (
          <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-6 shadow-2xl">

            <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#9E6B6B]" />
              Liste des utilisateurs inscrits
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">

                <thead>
                  <tr className="border-b border-[#9E6B6B]/20 text-[10px] font-mono uppercase text-neutral-600 tracking-wider">
                    <th className="py-3 px-4">Nom</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#9E6B6B]/10 text-sm">

                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-neutral-100 transition-colors"
                    >

                      <td className="py-3 px-4 font-medium">
                        {u.nom || 'N/A'}
                      </td>

                      <td className="py-3 px-4 text-neutral-600">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        <span
                          className={`px-2 py-1 ${
                            u.role === 'admin'
                              ? 'bg-[#9E6B6B] text-white'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.isApproved ? (
                          <span className="text-green-700 flex items-center gap-1 text-xs font-mono">
                            <CheckCircle size={14} />
                            Approuvé
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1 text-xs font-mono">
                            <ShieldAlert size={14} />
                            En attente
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">

                        {!u.isApproved && u.role !== 'admin' && (
                          <button
                            onClick={() => handleApprove(u._id)}
                            disabled={approving === u._id}
                            className={`px-3 py-1.5 text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                              approving === u._id
                                ? 'bg-neutral-400 cursor-not-allowed'
                                : 'bg-[#9E6B6B] hover:bg-[#8A5A5A]'
                            }`}
                          >
                            {approving === u._id
                              ? 'Traitement...'
                              : 'Approuver'}
                          </button>
                        )}

                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}