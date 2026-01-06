"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, X, Loader2, Camera, Image, FileImage, Trash2, Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Payment } from "@/types/payments";
import { getPaymentMethodEnumLabel } from "@/lib/payment-mappings";
import { getErrorMessage } from "@/lib/error-handler";

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSuccess: () => void;
}

export function PaymentConfirmModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: PaymentConfirmModalProps) {
  const [reference, setReference] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFileUrl, setProofFileUrl] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Resetear formulario cuando se abre el modal o cambia el pago
  useEffect(() => {
    if (isOpen && payment) {
      setReference(payment.reference || "");
      setError(null);
      setConfirming(false);
      setProofFile(null);
      setProofPreview(null);
      setProofFileUrl(null);
      setUploadingProof(false);
    }
  }, [isOpen, payment]);

  const handleClose = () => {
    setReference("");
    setError(null);
    setConfirming(false);
    setProofFile(null);
    setProofPreview(null);
    setProofFileUrl(null);
    setUploadingProof(false);
    onClose();
  };

  const handleFileSelect = (file: File) => {
    // SPRINT 4: Validar tipo de archivo (imágenes y PDFs)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Por favor selecciona una imagen (JPEG, PNG, WebP, GIF) o un PDF");
      return;
    }

    // SPRINT 4: Validar tamaño (máximo 10MB para evidencia de pago)
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo debe ser menor a 10MB");
      return;
    }

    setProofFile(file);
    setError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setProofFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile || !payment) return null;

    setUploadingProof(true);
    try {
      // SPRINT 4: Usar endpoint específico de evidencia de pago
      const response = await api.uploadPaymentEvidence(proofFile, payment.id);
      
      // El backend devuelve comprobante_url directamente
      const url = response.comprobante_url || response.file?.url;
      if (url) {
        setProofFileUrl(url);
        return url;
      }
      throw new Error("No se recibió la URL del comprobante");
    } catch (err: any) {
      console.error("Error al subir comprobante:", err);
      setError(getErrorMessage(err) || "Error al subir el comprobante");
      return null;
    } finally {
      setUploadingProof(false);
    }
  };

  if (!isOpen || !payment) return null;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(num);
  };

  const handleConfirm = async () => {
    if (!payment) return;

    setConfirming(true);
    setError(null);

    try {
      // Subir comprobante si hay uno
      let uploadedProofUrl = proofFileUrl;
      if (proofFile && !proofFileUrl) {
        uploadedProofUrl = await uploadProof();
        if (!uploadedProofUrl) {
          setConfirming(false);
          return; // El error ya se estableció en uploadProof
        }
      }

      // Preparar datos para confirmación
      const confirmData: {
        metadata?: Record<string, any>;
        comprobante_url?: string; // SPRINT 4: Campo directo para comprobante
        proofType?: string;
        proofReference?: string;
        proofFileUrl?: string;
      } = {};

      // Si hay una referencia nueva o diferente, agregarla a metadata
      if (reference.trim() && reference.trim() !== payment.reference) {
        confirmData.metadata = {
          ...(payment.metadata || {}),
          reference: reference.trim(),
        };
      }

      // SPRINT 4: Agregar comprobante usando comprobante_url (campo directo)
      if (uploadedProofUrl) {
        confirmData.comprobante_url = uploadedProofUrl;
        // También agregar a metadata para backward compatibility
        if (!confirmData.metadata) {
          confirmData.metadata = {};
        }
        confirmData.metadata.comprobante_url = uploadedProofUrl;
        if (reference.trim()) {
          confirmData.metadata.reference = reference.trim();
        }
      }

      // Confirmar el pago
      await api.confirmPayment(payment.id, confirmData);

      // Éxito - cerrar modal y refrescar
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error("Error al confirmar pago:", err);
      setError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/90 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                Confirmar Cobro
              </h3>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white"
                disabled={confirming}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Verifica los datos del pago antes de confirmar
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Monto (readonly) */}
              <div className="space-y-2">
                <Label className="text-white/80">Monto</Label>
                <Input
                  type="text"
                  value={formatCurrency(payment.amount)}
                  readOnly
                  className="bg-white/5 border-white/10 text-white cursor-not-allowed"
                />
                <p className="text-white/50 text-xs">
                  Este campo no se puede modificar
                </p>
              </div>

              {/* Método (readonly) */}
              <div className="space-y-2">
                <Label className="text-white/80">Método de Pago</Label>
                <Input
                  type="text"
                  value={
                    payment.method
                      ? getPaymentMethodEnumLabel(payment.method)
                      : payment.payment_methods?.label || "Sin método"
                  }
                  readOnly
                  className="bg-white/5 border-white/10 text-white cursor-not-allowed"
                />
                {payment.provider && (
                  <p className="text-white/50 text-xs">
                    Proveedor: {payment.provider}
                  </p>
                )}
              </div>

              {/* Referencia (opcional, editable) */}
              <div className="space-y-2">
                <Label className="text-white/80">
                  Referencia <span className="text-white/50">(opcional)</span>
                </Label>
                <Textarea
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: Nro transferencia, comprobante, etc."
                  className="bg-white/5 border-white/10 text-white min-h-[80px]"
                  disabled={confirming}
                />
                <p className="text-white/50 text-xs">
                  Puedes agregar o modificar la referencia del pago
                </p>
              </div>

              {/* Adjuntar Comprobante */}
              <div className="space-y-2">
                <Label className="text-white/80">
                  Comprobante <span className="text-white/50">(opcional)</span>
                </Label>
                
                {/* Inputs ocultos */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />

                {!proofPreview ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCameraClick}
                      disabled={confirming || uploadingProof}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Cámara
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGalleryClick}
                      disabled={confirming || uploadingProof}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Galería
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Preview del comprobante */}
                    <div className="relative bg-white/5 rounded-lg border border-white/10 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {proofPreview && (
                            <img
                              src={proofPreview}
                              alt="Preview comprobante"
                              className="w-16 h-16 object-cover rounded border border-white/20 cursor-pointer"
                              onClick={() => setShowPreviewModal(true)}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {proofFile?.name || "Comprobante"}
                          </p>
                          <p className="text-white/50 text-xs">
                            {proofFile
                              ? `${(proofFile.size / 1024).toFixed(1)} KB`
                              : "Listo para subir"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreviewModal(true)}
                            disabled={confirming || uploadingProof}
                            className="text-white/60 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveProof}
                            disabled={confirming || uploadingProof}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {uploadingProof && (
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Subiendo comprobante...
                      </div>
                    )}
                  </div>
                )}
                <p className="text-white/50 text-xs">
                  Puedes adjuntar una foto o PDF del comprobante de pago (máx. 10MB)
                </p>
              </div>

              {/* Información adicional */}
              {payment.created_at && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-xs">
                    Pago creado:{" "}
                    {new Date(payment.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  disabled={confirming}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirming || uploadingProof}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {confirming || uploadingProof ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadingProof ? "Subiendo..." : "Confirmando..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Cobro
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview del Comprobante */}
      {showPreviewModal && proofPreview && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Vista Previa del Comprobante</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={proofPreview}
                alt="Comprobante"
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
            </div>
            {proofFile && (
              <p className="text-white/60 text-sm mt-4 text-center">
                {proofFile.name} • {(proofFile.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

