<template>
<!--    <el-input v-model="url"></el-input>-->
<!--    <el-button @click="mintItem">mint a token</el-button>-->
    <h1>All Nft Items on-sale</h1>
    <div class="main" v-for="(item,index) in items" :key="item.tokenId">
        <el-dropdown placement="right">
            <el-card class="box-card">
                <el-image style="width: 440px; height: 200px" :src="pic[index]" :fit="fit" />
            </el-card>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item>
                        <h5>creator: {{item.creator}}</h5>
                    </el-dropdown-item>
                    <el-dropdown-item>
                        <h5>price: {{item.price/1000000000000000000}} ETH</h5>
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="buy(item.tokenId,item.price)">buy this Nft</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

    </div>
</template>

<script>
import Web3 from "web3"
import NFTMarketplace from "../../build/contracts/NFTMarketplace.json";
import { ElMessage } from 'element-plus'

export default {
    data(){
        return{
            url:"",
            items:[],
            pic:[]
        }
    },
    name: "NftMarketHome",
    methods: {
        getItems(){
            this.$store.watch(async (newState, oldState) => {
                if (newState.contract !== undefined) {
                    this.items = await newState.contract.methods.getAllNftOnSale().call();
                    console.log(this.items)
                    if (this.items!=[]){
                        this.items.map(async item => {
                            const picture = await newState.contract.methods.tokenURI(item.tokenId).call();
                            this.pic.push(picture)
                        });
                    }
                }
            })
        },
        async mintItem() {
            await this.$store.state.contract.methods.mintToken(this.url, Web3.utils.toWei("13.25", "ether")).send({
                from: this.$store.state.account,
                value: this.$store.state.listPrice
            });
            this.$router.go(0);
        },
        async buy(tokenId,itemPrice){
            var price = Web3.utils.fromWei(itemPrice,'ether');
            await this.$store.state.contract.methods.buyNft(tokenId).send({
                from: this.$store.state.account,
                value: itemPrice
            });

            console.log("buy a ntf")
            ElMessage('successfully purchase')
            this.$router.go(0);
        }
        // async test() {
        //     let web3 = new Web3(window.ethereum);
        //     console.log(web3)
        //     const accounts = await web3.eth.getAccounts();
        //     console.log("accounts",accounts[0]);
        //     const balance = await web3.eth.getBalance(accounts[0]);
        //     console.log("balance", balance);
        //     const networkId = await web3.eth.net.getId();
        //     console.log("networkId", networkId);
        //     const contract = new web3.eth.Contract(NFTMarketplace.abi,NFTMarketplace.networks[networkId].address);
        //     console.log("contract:", contract)
        //     //first we should mint a NFT item
        //     let _listingPrice = Web3.utils.toWei("0.025", "ether");
        //     await contract.methods.mintToken("http://222.com", Web3.utils.toWei("10", "ether")).send({
        //         from: accounts[0],
        //         value: _listingPrice
        //     });
        //     const Items = await contract.methods.getAllNftOnSale().call();
        //     this.items = Items
        //     console.log("Items",Items)
        //     console.log( _listingPrice)
        // }

    },
    created() {

        this.getItems();
    },
}
</script>

<style>
.main{
    padding-top: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.box-card {
    width: 480px;
}
</style>