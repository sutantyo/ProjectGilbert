#include <iostream>
#include <utility>
#include <iterator>
#include <algorithm>
#include <vector>

#include <boost/lambda/lambda.hpp>
#include <boost/graph/graph_traits.hpp>
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/dijkstra_shortest_paths.hpp>


using namespace boost;

int main()
{
	/*
	using namespace boost::lambda;
	typedef std::istream_iterator<int> in;

	std::for_each(in(std::cin), in(), std::cout<< (_1 * 3) << " ");
	*/

	/* Source : http://www.boost.org/doc/libs/1_59_0/libs/graph/doc/quick_tour.html */

	enum { A, B, C, D, E, N};
	const int num_vertices = N;
	const char* name = "ABCDE";

	typedef adjacency_list<vecS, vecS, undirectedS> Graph;
	typedef std::pair<int,int> Edge;

	Edge edge_array[] =
		{ Edge(A,B), Edge(A,C), Edge(C,A), Edge(D,C),
			Edge(C,E), Edge(B,D), Edge(D,E) };
	const int num_of_edges = sizeof(edge_array)/sizeof(edge_array[0]);

	//Graph g(num_vertices);
	//for(int i = 0; i < num_of_edges; ++i)
	//	add_edge(edge_array[i].first,edge_array[i].second,g);

	Graph g(edge_array, edge_array + num_of_edges, num_vertices);


	typedef graph_traits<Graph>::vertex_descriptor Vertex;
	typedef property_map<Graph,vertex_index_t>::type IndexMap;
	IndexMap index = get(vertex_index, g);

	std::cout << "vertices(g) = ";
	typedef graph_traits<Graph>::vertex_iterator vertex_iter;
	std::pair<vertex_iter,vertex_iter> vp;
	for (vp = vertices(g); vp.first != vp.second; ++vp.first){
		Vertex v = *vp.first;
		std::cout << index[v] << " ";
	}
	std::cout << std::endl;


	// Accessing the Edge set

	std::cout << "edges(g) = ";
	graph_traits<Graph>::edge_iterator ei, ei_end;
	for (boost::tie(ei,ei_end) = edges(g); ei != ei_end; ++ei)
		std::cout << "(" << index[source(*ei,g)]
							<< "," << index[target(*ei,g)] << ") ";
		std::cout << std::endl;

}
