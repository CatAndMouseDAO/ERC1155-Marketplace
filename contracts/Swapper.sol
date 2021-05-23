//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapV2Exchange.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IWETH.sol";
import "hardhat/console.sol";

contract Swapper {
  using SafeMath for uint256;
  using UniswapV2ExchangeLib for IUniswapV2Exchange;

  IUniswapV2Factory internal constant factory =
    IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

  IWETH internal constant WETH =
    IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

  function swap(
    address _to
  ) external payable {
    WETH.deposit{ value: msg.value }();
    IERC20 to = IERC20(_to);
    IUniswapV2Exchange exchange = factory.getPair(to, WETH);
    uint256 returnAmount = exchange.getReturn(to, WETH, msg.value);
    
    WETH.transfer(address(exchange), msg.value);
    
    exchange.swap(returnAmount, 0, msg.sender, "");
      
  }
}
