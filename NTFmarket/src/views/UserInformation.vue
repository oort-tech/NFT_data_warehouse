<template>
    <h1>Owned Nft Items</h1>
    <div class="main" v-for="(item,index) in items" :key="item.tokenId">
        <el-dropdown placement="right">
            <el-card class="box-card">
                <el-image style="width: 440px; height: 200px" :src="pic[index]" :fit="fit"/>
            </el-card>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item>
                        <h5>creator: {{ item.creator }}</h5>
                    </el-dropdown-item>
                    <el-dropdown-item>
                        <h5>price: {{ item.price / 1000000000000000000 }} ETH</h5>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <h5 v-show="item.isListed" @click="offSale(item.tokenId)">set item off-sale</h5>

                        <h5 v-show="!item.isListed" @click="open(item.tokenId)">set item on-sale</h5>
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

    </div>
</template>


<script>
import Web3 from "web3"
import NFTMarketplace from "../../build/contracts/NFTMarketplace.json";
import {ElMessage, ElMessageBox} from 'element-plus'

export default {
    name: "UserInformation",
    data() {
        return {
            userId: "",
            items: [],
            pic: []
        }
    },
    created() {
        this.userId = this.$route.query.userId;
        this.getItems();
    },
    methods: {
        getItems() {
            this.$store.watch(async (newState, oldState) => {
                if (newState.contract !== undefined) {
                    this.items = await newState.contract.methods.getAllNftByOwner().call({
                        from: newState.account
                    });
                    console.log(this.items)
                    if (this.items != []) {
                        this.items.map(async item => {
                            const picture = await newState.contract.methods.tokenURI(item.tokenId).call();
                            this.pic.push(picture)
                            console.log(item)
                        });
                    }

                }
            })
        },
        async offSale(tokenId) {
            await this.$store.state.contract.methods.placeNftUnSale(tokenId).send({
                from: this.$store.state.account
            });
            this.$router.go(0)        },
        open(tokenId) {
            ElMessageBox.prompt('Please input new Price', 'Tip', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                // inputPattern:
                //     /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,
                inputErrorMessage: 'Invalid price',
            })
                .then(async ({value}) => {
                    console.log(value)
                    await this.onSale(tokenId, value)
                })
                .catch(() => {
                    ElMessage({
                        type: 'info',
                        message: 'Input canceled',
                    })
                })
        },
        async onSale(tokenId, newPrice) {
            console.log("new price:",newPrice)
            await this.$store.state.contract.methods.placeNftOnSale(tokenId, Web3.utils.toWei(newPrice, 'ether')).send({
                from: this.$store.state.account,
                value: this.$store.state.listPrice
            });
            console.log("onSale finish,new item:");
            const newItem = await this.$store.state.contract.methods.getNftItem(tokenId).call();
            console.log(newItem);
        }
    }
}
</script>

<style scoped>

</style>