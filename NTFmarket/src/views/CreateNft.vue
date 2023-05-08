<template>
  <div
    class="
      w-full
      pb-8
      min-h-screen
      pt-28
      mx-auto
      bg-gray-50
      lg:pt-46
      bg-gradient-to-r
      from-indigo-700
      to-indigo-200
    "
  >
    <h1
      class="text-2xl font-bold text-center text-white md:text-3xl xl:text-5xl"
    >
      Create a new NFT
    </h1>
    <p
      class="
        px-2
        mt-8
        text-xs
        font-bold
        text-center text-white
        md:text-lg
        xl:text-base
      "
    >
      please upload your NFT image
    </p>
   
    <div
      v-show="!uploadFile"
      @click="uploadClick"
      class="
        mt-8
        cursor-pointer
        w-40
        h-40
        border border-dashed border-gray-200
        mx-auto
        flex
        justify-center
        items-center
      "
    >
      <img :src="plusImg" class="w-10 h-10 block" />
    </div>
    <input type="file" accept="image" @change=uploadImage>
    <div
      class="w-48 h-72 min mx-auto mt-2 flex flex-col items-center"
      v-show="uploadFile && imgBase64"
    >
      <img :src="imgBase64" class="w-full max-h-72 block mx-auto" alt="" />
      <div
        class="btn btn-sm bg-indigo-200 mt-2 text-indigo-700"
        @click="resetFile"
      >
        Withdraw
      </div>
    </div>

    <div class="flex flex-col justify-center mt-12">
      <div class="mb-6 w-80 lg:w-96 mx-auto box flex flex-col">
        <input
          v-model="price"
          placeholder="price: ether,integer"
          class="
            bg-white
            rounded
            text-sm
            border-none
            text-grey-darkest
            flex-1
            w-full
            px-2
            mt-2
            py-3
            focus:ring-0
            outline-none
          "
        />
      </div>

      <div class="mx-auto btn bg-indigo-800 btn-md" @click="submit">Submit</div>
      <!-- <p class="mx-auto text-white" v-if="file">
        {{ file.name }} <span @click="resetFile">x</span>
      </p> -->
    </div>

    <!-- <input
      type="file"
      class="hidden"
      ref="fileInput"
      @click="(e:Event)=>{
    (e.target as HTMLInputElement).value = ''}"
      @change="chooseFile"
      accept="image/*,.txt"
    /> -->
  </div>
</template>

<script lang="ts" setup>
import Web3 from "web3"
import plusImg from "@/assets/plus.jpeg";
import { onMounted, ref, unref } from "vue";
import { ipfsUrl } from "../../pinata.config";
import { pinFileToIPFS, pinJSONToIPFS } from "@/utils/useIpfs";
import { isImage, isTxt, isSizeValid, fileToBase64 } from "@/utils/files";
import { useStore } from "vuex";
import NFTMarketplace from "../../build/contracts/NFTMarketplace.json";

const fileInput = ref<HTMLElement | null>(null);
const uploadFile = ref<File | null>(null);
const imgBase64 = ref<string>("");

async function uploadImage(e: Event): Promise<void> {
  const el = e.target as HTMLInputElement;
  const files=el.files as FileList;
  if (files.length > 0) {
    if (!isImage(files[0])) {
      alert("only image within 200k");
      return;
    }
    uploadFile.value = files[0];
    // web3.test();
    imgBase64.value = await fileToBase64(uploadFile.value);
  }
}

// web3.test();
// imgBase64.value = await fileToBase64(uploadFile.value);
function resetFile(): void {
    uploadFile.value = null;
    imgBase64.value = "";
    console.log();
}

const price=ref<string>("")

async function submit(): Promise<void> {
  const isinteger= /^[0-9]*[1-9][0-9]*$/.test(price.value);
  console.log(isinteger);
  if(!price.value || !isinteger) {
    alert("price should be integer");
    return;
  }
  if(uploadFile.value){
    try{
      let result = await pinFileToIPFS(uploadFile.value);
      console.log(result.data.IpfsHash);

      if (result){
        const ipfsHash= result.data.IpfsHash;
        const url = `${ipfsUrl}${ipfsHash}`;
        //console.log(url);
        let web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        //console.log("accounts",typeof accounts[0]);
        const balance = await web3.eth.getBalance(accounts[0]);
        //console.log("balance",typeof balance);
        const networkId = await web3.eth.net.getId();
        //console.log("networkId",typeof networkId);
        let _listingPrice = Web3.utils.toWei("0.025", "ether");
        const contract = new web3.eth.Contract(NFTMarketplace.abi,NFTMarketplace.networks[networkId].address);
        const nftcreate= await contract.methods.mintToken(url, Web3.utils.toWei(price.value, "ether")).send({
                from: accounts[0],
                value: _listingPrice
            });
        console.log(nftcreate);
        //const nftonsale = await contract.methods.placeNftOnSale(nftcreate, Web3.utils.toWei(price.value, "ether"))
        if (nftcreate){
          alert("Succeed");
        } 
        else{
          alert("failed");
        }
      }
      else{
        alert(result.statusText);
      }
    }
    catch(e){
      console.error(e);
      alert("request failed");
    }
  }
}

</script>

<style scoped>

</style>