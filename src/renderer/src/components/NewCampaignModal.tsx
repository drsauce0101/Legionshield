import { useEffect, useState } from 'react'
import { X, Image, ChevronDown, Loader2, Swords } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import type { Campaign, CampaignFormData } from '../../../types'

interface NewCampaignModalProps {
  editTarget?: Campaign | null
  defaultFolderId?: number | null
  onClose: () => void
}

const INITIAL_FORM: CampaignFormData = {
  name: '',
  description: '',
  banner_url: '',
  system_id: 1,
  folder_id: undefined
}

export function NewCampaignModal({ editTarget, defaultFolderId, onClose }: NewCampaignModalProps): JSX.Element {
  const { systems, folders, fetchSystems, fetchFolders, createCampaign, updateCampaign } = useCampaignStore()
  const [form, setForm] = useState<CampaignFormData>(INITIAL_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [bannerPreview, setBannerPreview] = useState('')

  const isEdit = !!editTarget

  useEffect(() => {
    if (systems.length === 0) fetchSystems()
    fetchFolders('campaign')
  }, [fetchSystems, fetchFolders])

  useEffect(() => {
    if (editTarget) {
      setForm({
        name: editTarget.name,
        description: editTarget.description,
        banner_url: editTarget.banner_url,
        system_id: editTarget.system_id,
        folder_id: editTarget.folder_id
      })
      setBannerPreview(editTarget.banner_url)
    } else {
      setForm({
        ...INITIAL_FORM,
        folder_id: defaultFolderId || undefined
      })
      setBannerPreview('')
    }
  }, [editTarget, defaultFolderId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'system_id' ? Number(value) : value
    }))
    if (name === 'banner_url') setBannerPreview(value)
  }

  const handleSelectImage = async () => {
    try {
      const url = await window.api.system.selectImage()
      if (url) {
        setForm(prev => ({ ...prev, banner_url: url }))
        setBannerPreview(url)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setIsSaving(true)
    try {
      if (isEdit && editTarget) {
        await updateCampaign(editTarget.id, form)
      } else {
        await createCampaign(form)
      }
      onClose()
    } catch {
      /* errors handled in store */
    } finally {
      setIsSaving(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" id="modal-campaign-form">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-none bg-white border border-white/20">
              <Swords className="w-4.5 h-4.5 text-black" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">
                {isEdit ? 'Editar Campanha' : 'Nova Campanha'}
              </h2>
              <p className="text-dark-400 text-xs">
                {isEdit ? 'Atualize os dados da campanha.' : 'Preencha os dados para criar uma nova campanha.'}
              </p>
            </div>
          </div>
          <button
            id="btn-modal-close"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-none text-dark-400 hover:text-white hover:bg-white/10 transition-all duration-150 no-drag"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form id="form-campaign" onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="input-name" className="form-label">Nome da Campanha *</label>
            <input
              id="input-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: A Maldição do Rei Esquecido"
              className="input-field text-select"
              required
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="input-description" className="form-label">Descrição</label>
            <textarea
              id="input-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Uma breve sinopse da campanha..."
              rows={3}
              className="input-field resize-none text-select"
            />
          </div>

          {/* Sistema */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="select-system" className="form-label">Sistema de RPG</label>
              <div className="relative">
                <select
                  id="select-system"
                  name="system_id"
                  value={form.system_id}
                  onChange={handleChange}
                  className="input-field appearance-none pr-10"
                >
                  {systems.length === 0 ? (
                    <option value={1}>Genérico</option>
                  ) : (
                    systems.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="select-folder" className="form-label">Pasta</label>
              <div className="relative">
                <select
                  id="select-folder"
                  name="folder_id"
                  value={form.folder_id || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, folder_id: e.target.value ? Number(e.target.value) : undefined }))}
                  className="input-field appearance-none pr-10"
                >
                  <option value="">Sem pasta (Raiz)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Banner URL */}
          <div>
            <label htmlFor="input-banner" className="form-label">Imagem de Banner</label>
            <div className="flex gap-2 items-start">
              <div className="flex-1 flex gap-2">
                <input
                  id="input-banner"
                  name="banner_url"
                  type="text"
                  value={form.banner_url}
                  onChange={handleChange}
                  placeholder="URL ou arquivo local..."
                  className="input-field text-select flex-1"
                />
                <button
                  type="button"
                  onClick={handleSelectImage}
                  className="px-3 py-2 bg-dark-800 border border-white/20 text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
                  title="Selecionar imagem do computador"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
              {/* Preview thumbnail */}
              {bannerPreview && (
                <div className="w-16 h-10 rounded-none overflow-hidden border border-white/20 flex-shrink-0 bg-dark-800">
                  <img
                    src={bannerPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setBannerPreview('')}
                  />
                </div>
              )}
              {!bannerPreview && (
                <div className="w-16 h-10 rounded-none border border-white/20 flex-shrink-0 bg-dark-800 flex items-center justify-center">
                  <Image className="w-4 h-4 text-dark-500" />
                </div>
              )}
            </div>
            <p className="text-xs text-dark-500 mt-1">Cole a URL ou selecione uma imagem do seu computador.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              id="btn-cancel"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-campaign"
              disabled={isSaving || !form.name.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                isEdit ? 'Salvar Alterações' : 'Criar Campanha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
