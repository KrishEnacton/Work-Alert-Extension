import { v4 as uuidv4 } from 'uuid'
import { QueryProps } from '../util/types'
import { StreamClient } from '../util/SSE'
import useBgJobs from './use-bg-job'
let accessToken: string = ''
let stream: any
chrome.storage.local.get(['gpt_access_token']).then((res) => {
  accessToken = res.gpt_access_token
})
const message_id = uuidv4()

const useGPT = () => {
  
  function getSession() {
    return new Promise((resolve) => {
      fetch('https://chat.openai.com/api/auth/session')
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

  function generateQueryParams(query: QueryProps) {
    console.log({query})
    const result: string[] = [
      `Name: ${query?.name}\nSkills: ${query?.skills.join(' ')}\nExperience: ${
        query.experience
      }\nInbuilt Proposal: ${query?.proposal}\n`,
      `Client Job Description: ${query?.job_description}`,
      `Extract pain points from client job description and write a cover letter using the Inbuilt Proposal in a ${
        query?.tone
      } tone and it should not exceed more than ${query?.range_of_words.split('_')[1]} words. `,
      `${query?.optional_info ? ` Additional Instructions: ${query?.optional_info}` : ''}`,
    ].filter(Boolean)

    return result
  }

  const generateAns = async (query: QueryProps) => {
    const queryParams: string[] = generateQueryParams(query)
    if (accessToken) {
      stream = new StreamClient('https://chat.openai.com/backend-api/conversation', {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          action: 'next',
          messages: [
            {
              content: {
                content_type: 'text',
                parts: queryParams,
              },
              id: message_id,
              role: 'user',
            },
          ],
          model: 'text-davinci-002-render-sha',
          parent_message_id: uuidv4(),
        }),
        method: 'POST',
        mode: 'no-cors',
        credentials: 'include',
      })

      //@ts-ignore
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        let tabId: any = tabs[0]?.id
        stream.onmessage = (event: any) => {
          if (event.data.trim() != 'data: [DONE]') {
            chrome.tabs.sendMessage(tabId, {
              type: 'generated_ans',
              data: event.data,
              isClosed: true,
            })
          } else {
            chrome.tabs.sendMessage(tabId, {
              type: 'generated_ans',
              isClosed: false,
            })
            stream.close()
          }
        }
      })

      //@ts-ignore
      stream._onStreamClosed = () => {
        genTitle()
      }
    }
  }
  const getToken = async () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('gpt_access_token', (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(res)
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
    await fetch('https://chat.openai.com/backend-api/conversations?offset=0&limit=20', {
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
        const response = await fetch(
          `https://chat.openai.com/backend-api/conversation/gen_title/${id}`,
          {
            headers: {
              accept: '*/*',
              authorization: `Bearer ${accessToken}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              message_id: message_id,
            }),
            method: 'POST',
          },
        )
        if (response.ok) {
          deleteTitle(id.toString())
        }
      })
  }

  async function deleteTitle(messageId: string) {
    fetch(`https://chat.openai.com/backend-api/conversation/${messageId}`, {
      headers: {
        accept: '*/*',
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
  }
  return { getSession, generateAns, genTitle, closeAns, getToken, deleteToken }
}

export default useGPT