import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Users, Target, CheckCircle2, X, Loader2, QrCode, Copy, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const GOAL_AMOUNT = 3500;
const INITIAL_COLLECTED = 290;

const CONTRIBUTION_VALUES = [5, 10, 15, 20, 25, 50];

export default function App() {
  const [collected, setCollected] = useState(INITIAL_COLLECTED);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const progressPercentage = (collected / GOAL_AMOUNT) * 100;

  const qrCodeFromData = (data: any) => {
    // Check various common paths for QR Code
    const pix = data.pix || data.data?.pix || data.transaction?.pix || data.data?.transaction?.pix;
    if (!pix) return null;
    
    // Check for specific fields reported by user
    if (pix.qr_code_base64 && typeof pix.qr_code_base64 === 'string') {
      return pix.qr_code_base64.startsWith('data:image') ? pix.qr_code_base64 : `data:image/png;base64,${pix.qr_code_base64}`;
    }
    if (pix.pix_url && typeof pix.pix_url === 'string' && (pix.pix_url.startsWith('http') || pix.pix_url.startsWith('data:image'))) {
      return pix.pix_url;
    }
    
    // Check for other direct URL or base64 in common fields
    const qr = pix.qr_code || pix.qrcode || pix.qr_code_url || pix.qrcode_url || pix.image || pix.url || pix.pix_qr_code;
    if (qr && typeof qr === 'string' && (qr.startsWith('http') || qr.startsWith('data:image'))) return qr;
    
    const base64 = pix.qrcode_base64 || pix.base64;
    if (base64 && typeof base64 === 'string') {
      if (base64.startsWith('data:image')) return base64;
      return `data:image/png;base64,${base64}`;
    }

    // If pix itself is a string and looks like a URL or base64
    if (typeof pix === 'string') {
      if (pix.startsWith('http') || pix.startsWith('data:image')) return pix;
      if (pix.length > 100) return `data:image/png;base64,${pix}`;
    }
    
    return null;
  };

  const getPayloadFromData = (data: any) => {
    const pix = data.pix || data.data?.pix || data.transaction?.pix || data.data?.transaction?.pix;
    if (!pix) return "";
    
    // Prioritize pix_qr_code as it's likely the payload based on user feedback
    const possibleFields = ['pix_qr_code', 'qr_code_text', 'payload', 'emv', 'code', 'text', 'copy_paste', 'copia_e_cola', 'qrcode'];
    for (const field of possibleFields) {
      if (pix[field] && typeof pix[field] === 'string' && pix[field].length > 10) return pix[field];
    }
    
    // If pix is a string and looks like a PIX payload (usually starts with 000201)
    if (typeof pix === 'string' && pix.startsWith('000201')) return pix;
    
    return "";
  };

  const handleAmountClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsModalOpen(true);
    setPixData(null);
    setError(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmount || !firstName || !lastName || !cpf || !phone) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/createPix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          cpf,
          phone,
          amountCents: selectedAmount * 100
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detailMsg = data.details?.errors ? JSON.stringify(data.details.errors) : (data.details || '');
        throw new Error(`${data.error}: ${detailMsg}`);
      }

      setPixData(data);
      console.log("IronPay Response:", data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPixData(null);
    setFirstName('');
    setLastName('');
    setCpf('');
    setPhone('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="max-w-4xl mx-auto pt-12 px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Heart size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Vaquinha Solidária</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Column: Campaign Info */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight leading-tight">
                Ajude-nos a alcançar nossa meta e transformar vidas.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Cada contribuição, por menor que seja, nos aproxima do nosso objetivo. 
                Sua generosidade faz a diferença na nossa comunidade.
              </p>
            </div>

            {/* Progress Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Arrecadado</p>
                  <p className="text-4xl font-bold text-orange-500">
                    R$ {collected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Meta</p>
                  <p className="text-xl font-semibold text-gray-600">
                    R$ {GOAL_AMOUNT.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-orange-500 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users size={16} />
                  <span>42 apoiadores</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  <Target size={16} />
                  <span>{progressPercentage.toFixed(2)}% da meta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contribution */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Escolha um valor para doar</h3>
              <div className="grid grid-cols-2 gap-3">
                {CONTRIBUTION_VALUES.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAmountClick(value)}
                    className="group relative py-4 px-2 rounded-2xl border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-center"
                  >
                    <span className="block text-sm text-gray-400 font-medium group-hover:text-orange-400 transition-colors">R$</span>
                    <span className="text-2xl font-bold group-hover:text-orange-600 transition-colors">{value}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Sua doação é processada de forma segura via PIX. O valor cai instantaneamente na conta da vaquinha.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal / Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={closeModal}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>

              <div className="p-8">
                {!pixData ? (
                  <>
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold mb-2">Quase lá!</h3>
                      <p className="text-gray-500">
                        Você escolheu doar <span className="font-bold text-orange-500">R$ {selectedAmount},00</span>. 
                        Preencha seus dados para gerar o PIX.
                      </p>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nome</label>
                          <input
                            required
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Ex: João"
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Sobrenome</label>
                          <input
                            required
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Ex: Silva"
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">CPF (Obrigatório para PIX)</label>
                        <input
                          required
                          type="text"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Telefone</label>
                        <input
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                          {error}
                        </div>
                      )}

                      <button
                        disabled={isLoading}
                        type="submit"
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Gerando PIX...
                          </>
                        ) : (
                          'Gerar Pagamento PIX'
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                      <QrCode size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">PIX Gerado!</h3>
                      <p className="text-gray-500">Escaneie o QR Code abaixo para finalizar sua doação de R$ {selectedAmount},00</p>
                    </div>

                      <div className="bg-gray-50 p-6 rounded-3xl inline-block border border-gray-100">
                        {/* Robust QR Code Detection with Fallback */}
                        {(() => {
                          const qrCode = qrCodeFromData(pixData);
                          const payload = getPayloadFromData(pixData);
                          
                          if (qrCode) {
                            return (
                              <img 
                                src={qrCode} 
                                alt="QR Code PIX" 
                                className="w-48 h-48 mx-auto"
                                referrerPolicy="no-referrer"
                              />
                            );
                          }

                          if (payload) {
                            return (
                              <div className="bg-white p-4 rounded-xl shadow-inner flex flex-col items-center mx-auto">
                                <QRCodeSVG value={payload} size={180} />
                                <p className="text-[10px] text-gray-400 mt-2">QR Code gerado via payload</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="w-48 h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 text-[10px] p-4 text-center">
                              <p className="mb-2">QR Code não encontrado.</p>
                              <div className="text-left overflow-auto max-h-full w-full">
                                <p className="font-bold mb-1">Estrutura detectada:</p>
                                {pixData.pix && <p>• pix: {Object.keys(pixData.pix).join(', ')}</p>}
                                {pixData.transaction?.pix && <p>• trans.pix: {Object.keys(pixData.transaction.pix).join(', ')}</p>}
                                {!pixData.pix && !pixData.transaction?.pix && <p>• Raiz: {Object.keys(pixData).join(', ')}</p>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Código Copia e Cola</p>
                      <div className="flex gap-2">
                        <input 
                          readOnly
                          value={getPayloadFromData(pixData)}
                          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 focus:outline-none"
                        />
                        <button 
                          onClick={() => {
                            const payload = getPayloadFromData(pixData);
                            if (payload) {
                              navigator.clipboard.writeText(payload);
                              alert("Código copiado!");
                            }
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto py-12 px-6 text-center border-t border-gray-100 mt-12">
        <p className="text-sm text-gray-400">
          © 2026 Vaquinha Digital. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
