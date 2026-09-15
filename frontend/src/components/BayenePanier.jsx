import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  removeFromCart,
  clearCart,
  updateQuantity,
} from '../features/cartSlice';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import bgBayene from '../assets/bg-bayene.jpg';

export default function Cart() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { items, totalItems } = useSelector((state) => state.cart);

  // Fonction utilitaire pour récupérer le prix (supporte 'price' et 'prix')
  const getPrice = (item) => {
    let price = item.price || item.prix;
    
    // Si c'est un nombre, on le retourne
    if (typeof price === 'number') return price;
    
    // Si c'est une chaîne, on la nettoie
    if (typeof price === 'string') {
      return parseFloat(price.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    }
    
    return 0;
  };

  const total = items.reduce((acc, item) => {
    const p = getPrice(item);
    return acc + (p * (item.quantite || 1));
  }, 0);

  const shipping = total > 150 || total === 0 ? 0 : 10;
  const finalTotal = total + shipping;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: items.map(item => ({
            productId: item.id,
            title: item.nom || item.name,
            price: getPrice(item),
            quantity: item.quantite
          })) 
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Erreur lors de la création de la session de paiement');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white pt-24 sm:pt-32 pb-24 px-4 sm:px-10 lg:px-16 overflow-hidden">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bgBayene})`,
          opacity: 0.5
        }}
      />
      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      <div 
        className={`relative z-10 max-w-7xl w-full mx-auto space-y-8 sm:space-y-12 transition-all duration-1000 ease-out transform ${
          isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
            Bayene Eyewear & La Roselle Atelier
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-white font-light tracking-wide">
            Votre Panier
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-light">
            {totalItems} article(s)
          </p>
          <div className="w-16 h-[1px] bg-[#9E6B6B] mx-auto pt-2" />
        </div>

        {items.length === 0 ? (
          <div 
            style={{ borderRadius: '0px' }}
            className="max-w-xl mx-auto bg-[#F7F3F2]/90 backdrop-blur-md border border-[#9E6B6B]/40 p-8 sm:p-14 shadow-2xl relative rounded-none text-center space-y-6 text-[#3A3230]"
          >
            <div 
              style={{ borderRadius: '0px' }}
              className="w-16 h-16 bg-[#EAE4E1] border border-[#9E6B6B]/40 mx-auto flex items-center justify-center text-[#9E6B6B] rounded-none"
            >
              <ShoppingBag size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-serif font-light">
                Votre panier est vide
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                Découvrez nos collections raffinées et trouvez la monture idéale.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/collection"
                style={{ borderRadius: '0px' }}
                className="inline-flex items-center justify-center gap-3 w-full py-4 px-8 text-xs font-medium uppercase tracking-widest text-white bg-[#9E6B6B] hover:bg-[#8A5A5A] border border-[#9E6B6B]/60 transition-all duration-300 shadow-lg rounded-none"
              >
                Explorer la collection <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                  Articles sélectionnés
                </span>
                <button
                  onClick={() => dispatch(clearCart())}
                  className="text-xs text-[#d4a3a3] hover:text-white transition-colors underline cursor-pointer"
                >
                  Vider le panier
                </button>
              </div>

              {items.map((item) => {
                const itemPrice = getPrice(item);
                const displayName = item.nom || item.name;
                return (
                  <div
                    key={item.id}
                    style={{ borderRadius: '0px' }}
                    className="bg-[#F7F3F2]/95 backdrop-blur-md p-4 sm:p-6 border border-[#9E6B6B]/40 shadow-xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-all hover:border-[#9E6B6B]/80 rounded-none text-[#3A3230]"
                  >
                    <div 
                      style={{ borderRadius: '0px' }}
                      className="w-24 h-24 sm:w-28 sm:h-28 bg-[#EAE4E1] border border-[#9E6B6B]/30 overflow-hidden flex items-center justify-center p-2 flex-shrink-0 rounded-none"
                    >
                      <img
                        src={item.image}
                        alt={displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <h3 className="text-sm font-medium tracking-tight font-serif text-[#3A3230]">
                        {displayName}
                      </h3>
                      <p className="text-xs text-neutral-500 font-light">
                        {item.categorie || "Édition Atelier"}
                      </p>
                      <p className="text-sm font-semibold text-[#9E6B6B] pt-1 font-mono">
                        {itemPrice} €
                      </p>
                    </div>

                    <div 
                      style={{ borderRadius: '0px' }}
                      className="flex items-center gap-3 bg-[#EAE4E1] border border-[#9E6B6B]/30 px-3 py-1.5 rounded-none"
                    >
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.id,
                              quantite: item.quantite - 1,
                            })
                          )
                        }
                        className="text-neutral-700 hover:text-black transition-colors p-1 cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-mono font-medium text-[#3A3230] w-4 text-center">
                        {item.quantite}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.id,
                              quantite: item.quantite + 1,
                            })
                          )
                        }
                        className="text-neutral-700 hover:text-black transition-colors p-1 cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => dispatch(removeFromCart(item.id))}
                      style={{ borderRadius: '0px' }}
                      className="text-neutral-500 hover:text-rose-700 p-2 hover:bg-rose-100 transition-all sm:ml-2 cursor-pointer rounded-none"
                      title="Supprimer l'article"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <div className="pt-4">
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-2 text-xs text-neutral-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Continuer vos achats</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-36">
              <div 
                style={{ borderRadius: '0px' }}
                className="bg-[#F7F3F2]/95 backdrop-blur-md p-6 sm:p-8 border border-[#9E6B6B]/40 shadow-2xl space-y-6 relative rounded-none text-[#3A3230]"
              >
                <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-[#3A3230] border-b border-[#9E6B6B]/30 pb-4">
                  Résumé de la Commande
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-neutral-700">
                    <span>Sous-total</span>
                    <span className="font-mono text-[#3A3230]">{total} €</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>Livraison estimée</span>
                    <span className="font-mono">
                      {shipping === 0 ? (
                        <strong className="text-[#9E6B6B] font-normal">Offerte</strong>
                      ) : (
                        <span className="text-[#3A3230]">{shipping} €</span>
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[10px] text-neutral-500 italic">
                      Livraison offerte dès 150 € d'achat.
                    </p>
                  )}
                </div>

                <div className="border-t border-[#9E6B6B]/30 pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-medium text-[#3A3230] uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-xl font-semibold text-[#9E6B6B] font-mono">
                    {finalTotal} €
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  style={{ borderRadius: '0px' }}
                  className="w-full bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white py-4 px-6 text-xs tracking-[0.15em] uppercase transition-all shadow-lg border border-[#9E6B6B]/60 active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Redirection...</span>
                    </>
                  ) : (
                    <>
                      <span>Commander</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <div className="space-y-2 pt-2 border-t border-[#9E6B6B]/30 text-[10px] text-neutral-500 text-center uppercase tracking-widest font-mono">
                  <p>Paiement 100% sécurisé via Stripe</p>
                  <p>Expédition sous 24h à 48h</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}