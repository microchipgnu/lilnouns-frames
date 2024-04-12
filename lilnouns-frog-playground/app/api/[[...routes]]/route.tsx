/** @jsxImportSource frog/jsx */

import { getNounData, getRandomNounSeed } from '@lilnounsdao/assets'
import { buildSVG } from '@lilnounsdao/sdk'
import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { ImageData } from '@lilnounsdao/assets'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { defaultImageOptions } from '@/app/config'
const { palette } = ImageData; // Used with `buildSVG``
import { createSystem } from 'frog/ui'
import { kv } from '@vercel/kv'



const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  headers: {
    'Cache-Control': 'max-age=0',
  }
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', (c) => {
  return c.res({
    image: `${process.env.APP_URL}/panel.gif`,
    intents: [
      <Button action={`${process.env.APP_URL}/api/playground`}>Generate</Button>
    ],
    imageAspectRatio: "1:1",
    imageOptions: {
      ...defaultImageOptions,
    }
  })
})

app.frame('/playground', (c) => {
  const seed = getRandomNounSeed()
  const data = getNounData(seed);

  const { background, body, accessory, head, glasses, } = seed


  const svgBinary = buildSVG(data.parts, palette, data.background);
  const svgBase64 = btoa(svgBinary);

  const seedUrl = `${process.env.APP_URL}/api/seed/${background},${body},${accessory},${head},${glasses}`
  const encodedUrlValue = encodeURIComponent(seedUrl);
  const link = `https://warpcast.com/~/compose?text=${encodeURIComponent(`Vote on my on-frame Lil Noun /lilnounsdao \n✅  ⌐◨-◨  ❌`)}&embeds[]=${encodedUrlValue}`;

  return c.res({
    image: (
      <div tw="flex items-center justify-center h-screen w-screen relative" style={{ fontFamily: 'Londrina Solid', }}>
        <img src={`data:image/svg+xml;base64,${svgBase64}`} style={{ width: 600, height: 600 }} />
      </div>
    ),
    intents: [
      <Button value="">Generate</Button>,
      <Button.Link href={link}>Share</Button.Link>,
    ],
    imageAspectRatio: "1:1",
    imageOptions: {
      ...defaultImageOptions,
    }
  })
})
app.frame('/seed/:seed', async (c) => {
  const seedEncoded = c.req.param("seed")

  if (c.frameData?.buttonIndex === 3) {
    kv.incr(`farcaster:lilnouns:seed:${seedEncoded}:upvotes`);
  }
  else if (c.frameData?.buttonIndex === 4) {
    kv.incr(`farcaster:lilnouns:seed:${seedEncoded}:downvotes`);
  }

  const upvotes = await kv.get(`farcaster:lilnouns:seed:${seedEncoded}:upvotes`) as number;
  const downvotes = await kv.get(`farcaster:lilnouns:seed:${seedEncoded}:downvotes`) as number;

  const totalVotes = (upvotes || 0) + (downvotes || 0);
  const [background, body, accessory, head, glasses,] = seedEncoded!.split(",")

  const data = getNounData({
    accessory: parseInt(accessory),
    background: parseInt(background),
    body: parseInt(body),
    head: parseInt(head),
    glasses: parseInt(glasses),
  });

  const svgBinary = buildSVG(data.parts, palette, data.background);
  const svgBase64 = btoa(svgBinary);
  const totalVotesNumber = Number(totalVotes);
  const upvotesNumber = Number(upvotes || 0);
  const downvotesNumber = Number(downvotes || 0);

  const leftVotesPercentage = totalVotesNumber > 0 ? ((upvotesNumber / totalVotesNumber) * 100).toFixed(2) + '%' : '0%';
  const rightVotesPercentage = totalVotesNumber > 0 ? ((downvotesNumber / totalVotesNumber) * 100).toFixed(2) + '%' : '0%';

  return c.res({
    image: (
      <div tw="flex items-center justify-center h-screen w-screen relative" style={{ fontFamily: 'Londrina Solid', }}>
        <div
          tw='flex'
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: leftVotesPercentage,
            backgroundColor: 'green',
          }}
        />

        <div
          tw="flex"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: rightVotesPercentage,
            backgroundColor: 'red',
          }}
        />

        <div tw="flex relative items-center justify-center h-screen w-screen" style={{ width: 600, height: 600, fontFamily: 'Londrina Solid', }}>
          <img src={`data:image/svg+xml;base64,${svgBase64}`} tw="h-full w-full" />
          <div tw="flex flex-col absolute left-0 bottom-0 m-4 justify-center items-center bg-gray-200 px-4 py-2">
            <div>✅</div>
            <div>{upvotesNumber.toString()}</div>
          </div>
          <div tw="flex flex-col absolute right-0 bottom-0 m-4 justify-center items-center bg-gray-200 px-4 py-2">
            <div>❌</div>
            <div>{downvotesNumber.toString()}</div>
          </div>
        </div>
      </div>
    ),
    intents: [
      <Button action={`${process.env.APP_URL}/api/playground`}>Create</Button>,
      <Button value="">Refresh</Button>,
      <Button value="">✅</Button>,
      <Button value="">❌</Button>,
    ],
    imageAspectRatio: "1:1",
    imageOptions: {
      ...defaultImageOptions,
    }
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
