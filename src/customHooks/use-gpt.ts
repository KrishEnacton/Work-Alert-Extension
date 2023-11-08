import { v4 as uuidv4 } from 'uuid'
import { QueryProps } from '../util/types'
import { StreamClient } from '../util/SSE'
import { config } from '../util/config'
let accessToken: string = ''
let stream: any
chrome.storage.local.get(['gpt_access_token']).then((res) => {
  accessToken = res.gpt_access_token
})
const message_id = uuidv4()

const useGPT = () => {
  function getSession() {
    return new Promise((resolve) => {
      fetch(config.gpt_session_api)
        .then((res) => res.json())
        .then((data) => {
          if (data.accessToken) {
            chrome.storage.local.set({ gpt_access_token: data.accessToken })
            resolve(true)
          } else {
            chrome.storage.local.set({ gpt_access_token: null })
            resolve(false)
          }
        })
        .catch((err) => {
          resolve(false)
          console.log(err)
        })
    })
  }

  const generateAns = async (queryParams: string[]) => {
    const { success, data } = (await getSession()) as any
    if (success) {
      stream = new StreamClient(config.gpt_conversation_api, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US',
          authorization: `Bearer ${data.accessToken}`,
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          action: 'next',
          messages: [
            {
              id: message_id,
              author: {
                role: 'user',
              },
              content: {
                content_type: 'text',
                parts: queryParams,
              },
              metadata: {},
            },
          ],
          parent_message_id: uuidv4(),
          model: 'text-davinci-002-render-sha',
          timezone_offset_min: -330,
          suggestions: [],
          history_and_training_disabled: false,
          arkose_token: null,
          conversation_mode: {
            kind: 'primary_assistant',
          },
          force_paragen: false,
          force_rate_limit: false,
        }),
        method: 'POST',
        mode: 'no-cors',
        credentials: 'include',
      })

      //@ts-ignore
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        let tabId: any = tabs[0]?.id
        stream.onmessage = (event: any) => {
          if (event.data.trim().slice(-12) != 'data: [DONE]') {
            if (
              event.data.lastIndexOf('data: {"message"') <
                event.data.lastIndexOf('"error": null') &&
              event.data.lastIndexOf('data: {"message"') >= 0
            ) {
              let value = event.data.slice(
                event.data.lastIndexOf('data: {"message"'),
                event.data.lastIndexOf('"error": null'),
              )
              const data: any = JSON.parse(value.slice(6, value.length - 2) + '}')
              chrome.tabs.sendMessage(tabId, {
                type: 'generated_ans',
                data: data?.message?.content?.parts[0].toString(),
                isClosed: true,
              })
            }
          } else {
            chrome.tabs.sendMessage(tabId, {
              type: 'generated_ans',
              isClosed: false,
            })
            stream.close()
          }
        }
        stream._onStreamClosed = () => {
          genTitle()
        }
        stream.onerror = (err: any) => {
          chrome.tabs.sendMessage(tabId, {
            type: 'generated_ans',
            error: true,
          })
        }
      })
    }
  }
  const getToken = async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'session_call' }, (res: any) => {
        if (res && res.data.accessToken) {
          chrome.storage.local.set({ gpt_access_token: res.data.accessToken })
          resolve({ gpt_access_token: res.data.accessToken })
        } else {
          chrome.storage.local.set({ gpt_access_token: null })
          resolve({})
        }
      })
    })
  }

  const deleteToken = async () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove('gpt_access_token').then(() => {
        resolve(true)
      })
    })
  }
  async function genTitle() {
    await fetch(`${config.gpt_conversation_api}s?offset=0&limit=20`, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      method: 'GET',
    })
      .then((res) => res.json())
      .then(async (data) => {
        let id = data.items[0]?.id
        const response = await fetch(`${config.gpt_conversation_api}/gen_title/${id}`, {
          headers: {
            accept: '*/*',
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            message_id: message_id,
          }),
          method: 'POST',
        })
        if (response.ok) {
          deleteTitle(id.toString())
        }
      })
  }

  async function deleteTitle(messageId: string) {
    await fetch(`${config.gpt_conversation_api}/${messageId}`, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US',
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        is_visible: false,
      }),
      method: 'PATCH',
    }).catch((err) => console.log({ err }))
  }

  function closeAns() {
    //@ts-ignore
    stream.close()
    setTimeout(() => {
      genTitle()
    }, 500)
  }
  return { getSession, generateAns, genTitle, closeAns, getToken, deleteToken }
}

export default useGPT
