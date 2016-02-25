package cn.ihealthbaby.hospital.admin.client;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.concurrent.Future;
import java.util.Map.Entry;
import java.util.List;

/**
 * http 请求实现接口，客户端自行实现
 * @author zuoge85 on 15/6/15.
 */
public interface HttpClientAdapter {
	/**
	 *
	 * @param form 可能为空
	 */
	<T> Result<T> request(String method, String uri, List<Entry<String, Object>> form, Type type, boolean isAccount);

	/**
	 *
	 * @param form 可能为空
	 */
	<T> Future<?> requestAsync(String method, String uri, List<Entry<String, Object>> form, Type type,
			boolean isAccount, Callback<T> callable);

	void close() throws IOException;

	interface Callback<T> {
		void call(Result<T> t);
	}
}
