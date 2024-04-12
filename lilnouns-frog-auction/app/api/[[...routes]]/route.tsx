/** @jsxImportSource frog/jsx */
// @ts-nocheck

import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next';
import { serveStatic } from 'frog/serve-static';

import { ImageData, getNounData } from '@lilnounsdao/assets';
import { ChainId, NounsAuctionHouseABI, NounsTokenABI, buildSVG, getContractAddressesForChainOrThrow } from '@lilnounsdao/sdk';
import { Abi, createPublicClient, encodeFunctionData, formatEther, getContract, http, parseEther } from 'viem';
import { mainnet } from 'viem/chains';
import { createSystem } from 'frog/ui';
const { palette } = ImageData; // Used with `buildSVG``


const { Box, Text, vars, VStack, HStack, Heading, Column, Columns, Image, Row, Rows } = createSystem({
  colors: {
    text: '#000000',
    background: '#ffffff',
    blue: '#0070f3',
    green: '#00ff00',
    red: '#ff0000',
    orange: '#ffaa00',
    grey: '#b3b3b3',

  },
  fonts: {
    default: [
      {
        name: 'Londrina Solid',
        source: 'google',
        weight: 400,
      },
      {
        name: 'Londrina Solid',
        source: 'google',
        weight: 900,
      },
    ],
  }
})


const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  ui: {
    vars
  }
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

const { nounsToken, nounsAuctionHouseProxy } = getContractAddressesForChainOrThrow(ChainId.Mainnet);

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`),
})

const auctionsContract = getContract({
  address: nounsAuctionHouseProxy as `0x${string}`,
  abi: NounsAuctionHouseABI as Abi,
  client: publicClient,
})

const tokenContract = getContract({
  address: nounsToken as `0x${string}`,
  abi: NounsTokenABI as Abi,
  client: publicClient,
})

function timeUntil(unixTime: number): string {
  const now = Date.now(); // current time in milliseconds
  const endTime = unixTime * 1000; // convert Unix epoch time to milliseconds
  const diff = endTime - now; // difference in milliseconds

  // Check if the time has already passed
  if (diff < 0) {
    return "ended";
  }

  // Calculate time components
  let seconds = Math.floor(diff / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  seconds %= 60; // seconds remaining after extracting minutes
  minutes %= 60; // minutes remaining after extracting hours
  hours %= 24; // hours remaining after extracting days

  // Format the result to ensure two digits for each component
  const pad = (unit: number) => unit.toString().padStart(2, '0');

  return `${pad(minutes)}m:${pad(seconds)}s`;
}

function shortenEthAddress(address: string, chars = 4): string {
  // Check if it's a valid Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid Ethereum address');
  }

  // Shorten the address by taking the first and last few characters
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

app.frame('/', async (c) => {
  const currentAuctionData = await auctionsContract.read.auction() as [bigint, bigint, bigint, bigint, string, boolean]

  const multiplier = 0.01;
  const scalingFactor = 100;
  const integerMultiplier = BigInt(Math.round(multiplier * scalingFactor));
  const nextPriceRaw = (currentAuctionData[1] * integerMultiplier) / BigInt(scalingFactor);

  const auctionData = {
    tokenId: currentAuctionData[0].toString(),
    price: formatEther(currentAuctionData[1]).toString(),
    priceRaw: formatEther(currentAuctionData[1]).toString(),
    nextPrice: formatEther(nextPriceRaw).toString(),
    nextPriceRaw: nextPriceRaw.toString(),
    startTime: currentAuctionData[2],
    endTime: currentAuctionData[3],
    bidder: currentAuctionData[4],
    settled: currentAuctionData[5],
    endingIn: timeUntil(Number(currentAuctionData[3])),
  }

  const seed = await tokenContract.read.seeds([Number(auctionData.tokenId.toString())]) as [number, number, number, number, number]
  const data = getNounData({
    background: seed[0],
    body: seed[1],
    accessory: seed[2],
    head: seed[3],
    glasses: seed[4],
  });
  const svgBinary = buildSVG(data.parts, palette, data.background);
  const svgBase64 = btoa(svgBinary);

  return c.res({
    image: (
      <Box width={'100%'} height={'100%'} backgroundColor={'background'}>
        <Columns gap="4" grow >
          <Column width="1/2" alignItems='center' justifyContent='center'>
            <Image src={`data:image/svg+xml;base64,${svgBase64}`} height={'100%'} />
          </Column>
          <Column width="1/2" alignItems='center' justifyContent='center'>
            <Rows gap="8" grow alignHorizontal='center' alignVertical='center' width={'100%'}>
              <Row height="1/5">
                <Text color={'text'} size={'32'}>Lil Noun {auctionData.tokenId}</Text>
              </Row>
              <Row height="1/2" width={'100%'}>
                <Columns gap="4" grow width={'100%'}>
                  <Column width="1/2" alignItems='center' justifyContent='center'>
                    <Text color={'grey'} size={"24"}>Current Bid</Text>
                    <Text color={'text'} size={'32'}>{`ETH ${auctionData.price}`}</Text>
                  </Column>
                  <Column width="1/2" alignItems='center' justifyContent='center'>
                    <Text color={'grey'} size={"24"}>Auction Ends In</Text>
                    <Text color={auctionData.endingIn === "ended" ? 'red' : 'text'} size={'32'}>{auctionData.endingIn}</Text>
                  </Column>
                </Columns>
              </Row>
              <Row height="1/5" alignContent='center' alignItems='center' alignVertical='center'>
                <Text color={'grey'} size={"20"}>Highest Bidder</Text>
                <Text color={'text'} size={'24'}>{shortenEthAddress(auctionData.bidder)}</Text>
              </Row>
            </Rows>
          </Column>
        </Columns>
      </Box>
    ),
    intents: [
      <Button value="">Refresh</Button>,
      <Button.Transaction action="tx" target={auctionData.endingIn === "ended" && auctionData.settled === false ? `/settle-create` : `/bid`}>
       {auctionData.endingIn === "ended" && auctionData.settled === false ? "Settle And Create" : "Bid"}
      </Button.Transaction>,
      <Button.Link href='https://lilnouns.wtf'>Learn More</Button.Link>,
    ],
    imageAspectRatio: "1.91:1",
  })
})

app.frame('/finish', (c) => {
  const { transactionId } = c
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Transaction ID: {transactionId}
      </div>
    )
  })
})


app.transaction('/bid', async (c) => {
  const currentAuctionData = await auctionsContract.read.auction() as [bigint, bigint, bigint, bigint, string, boolean]

  const multiplier = 0.01;
  const scalingFactor = 100;
  const integerMultiplier = BigInt(multiplier * scalingFactor);
  let nextPriceRaw = currentAuctionData[1] + (currentAuctionData[1] * integerMultiplier) / BigInt(scalingFactor);

  if(nextPriceRaw === 0n){
    nextPriceRaw = parseEther("0.15")
  }

  const auctionData = {
    tokenId: currentAuctionData[0].toString(),
    price: formatEther(currentAuctionData[1]).toString(),
    priceRaw: currentAuctionData[1].toString(),
    nextPrice: formatEther(nextPriceRaw).toString(),
    nextPriceRaw: nextPriceRaw.toString(),
    startTime: currentAuctionData[3],
    endTime: currentAuctionData[2],
    bidder: currentAuctionData[4],
    settled: currentAuctionData[5],
    endingIn: timeUntil(Number(currentAuctionData[2])),
  }

  const calldata = encodeFunctionData({
    abi: NounsAuctionHouseABI as Abi,
    functionName: "createBid",
    args: [nextPriceRaw],
  })

  return c.send({
    chainId: 'eip155:1',
    data: calldata,
    to: nounsAuctionHouseProxy as `0x${string}`,
    value: parseEther(auctionData.nextPrice),
  })
})

app.transaction('/settle-create', async (c) => {

  const calldata = encodeFunctionData({
    abi: NounsAuctionHouseABI as Abi,
    functionName: "settleCurrentAndCreateNewAuction",
    args: [],
  })

  return c.send({
    chainId: 'eip155:1',
    data: calldata,
    to: nounsAuctionHouseProxy as `0x${string}`,
    value: parseEther("0"), 
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
