'use client'

import { useModal } from '@/provider/modal-provider'
import { UploadMediaForm } from '../forms/upload-media-form'
import { CustomModal } from '../global/custom-modal'
import { Button } from '../ui/button'

type Props = {
  subaccountId: string
}

export const MediaUploadButton = ({ subaccountId }: Props) => {
  const { isOpen, setOpen, setClose } = useModal()

  return (
    <Button
      onClick={() => {
        setOpen(
          <CustomModal
            title="Upload Media"
            description="Upload a file to your media bucket"
          >
            <UploadMediaForm subaccountId={subaccountId}></UploadMediaForm>
          </CustomModal>
        )
      }}
    >
      Upload
    </Button>
  )
}

