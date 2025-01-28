// import { useDocumentStore } from '@/store/document.store'
// import { useDocument, useDocumentBlocks } from '@/hooks/queries/useDocument'
// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { queryKeys } from '@/lib/constants/queryKeys'
// import supabase from '@/lib/config/supabase'
// import { Block } from '@/types/base/documents.types'

// export function useDocumentCanvas(documentId: string) {
//   const queryClient = useQueryClient()
//   const {
//     blocks,
//     selectedBlockId,
//     setBlocks,
//     addBlock,
//     updateBlock,
//     deleteBlock,
//     moveBlock,
//     setSelectedBlock
//   } = useDocumentStore()

//   // Fetch document and blocks
//   const { data: document } = useDocument(documentId)
//   const { data: serverBlocks } = useDocumentBlocks(documentId)

//   // Sync server blocks with store
//   React.useEffect(() => {
//     if (serverBlocks) {
//       setBlocks(serverBlocks)
//     }
//   }, [serverBlocks])

//   // Mutations
//   const updateBlockMutation = useMutation({
//     mutationFn: async ({ blockId, content }: { blockId: string, content: Block['content'] }) => {
//       const { data, error } = await supabase
//         .from('blocks')
//         .update({
//           content,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', blockId)
//         .select()
//         .single()

//       if (error) throw error
//       return data
//     },
//     onMutate: async ({ blockId, content }) => {
//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({ queryKey: queryKeys.blocks.detail(blockId) })

//       // Optimistically update store
//       updateBlock(blockId, content)
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: queryKeys.blocks.byDocument(documentId) })
//     }
//   })

//   const addBlockMutation = useMutation({
//     mutationFn: async (block: Omit<Block, 'id'>) => {
//       const { data, error } = await supabase
//         .from('blocks')
//         .insert(block)
//         .select()
//         .single()

//       if (error) throw error
//       return data
//     },
//     onMutate: async (newBlock) => {
//       // Optimistically add to store
//       const tempId = `temp-${Date.now()}`
//       addBlock({ ...newBlock, id: tempId } as Block)
//       return { tempId }
//     },
//     onSuccess: (data, variables, context) => {
//       queryClient.invalidateQueries({ queryKey: queryKeys.blocks.byDocument(documentId) })
//     }
//   })

//   return {
//     document,
//     blocks,
//     selectedBlockId,
//     actions: {
//       updateBlock: (blockId: string, content: Block['content']) =>
//         updateBlockMutation.mutate({ blockId, content }),
//       addBlock: (block: Omit<Block, 'id'>) =>
//         addBlockMutation.mutate(block),
//       deleteBlock,
//       moveBlock,
//       setSelectedBlock
//     }
//   }
// }
