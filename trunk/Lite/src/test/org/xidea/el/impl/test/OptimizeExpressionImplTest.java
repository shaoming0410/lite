package org.xidea.el.impl.test;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.xidea.el.Expression;
import org.xidea.el.impl.ExpressionFactoryImpl;
import org.xidea.el.impl.OptimizeExpressionImpl;
import org.xidea.el.json.JSONDecoder;
import org.xidea.el.parser.ExpressionTokenizer;

public class OptimizeExpressionImplTest {

	@Before
	public void setUp() throws Exception {
	}

	@Test
	public void testCreate() {
		doTest("變量獲取","1","o","{\"o\":\"1\"}");
		doTest("屬性獲取","1","o.a","{\"o\":{\"a\":\"1\"}}");
		doTest("多重屬性獲取","2","o.a.b","{\"o\":{\"a\":{\"b\":\"2\"}}}");
	}

	private void doTest(String msg,Object expected,String el,String source) {
		Expression exp = OptimizeExpressionImpl.create(ExpressionFactoryImpl.getInstance(),new ExpressionTokenizer(el).getResult(), null, null);
		Assert.assertTrue("不需是有效的優化表達式/"+msg,exp instanceof OptimizeExpressionImpl);
		Assert.assertEquals(msg,expected, exp.evaluate(JSONDecoder.decode(source)));
	}

}